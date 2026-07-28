In November 2022 I was working through the hypothesis testing module of a Statistics for Engineers course, and I did what everyone was doing that year: I pasted a question into GPT-3.5.

> The mean lifetime of a sample of 25 bulbs is found as 1550 hours with a S.D. of 120 hours. The company claims the average life of their bulbs is 1600 hours. Is the claim acceptable at 5% L.O.S.?

It answered confidently. It was also wrong, in two separate ways that turned out to need two separate fixes.

The thing this eventually turned into is a small web app. A chat window takes a pasted word problem and sends it to a Flask backend. The backend runs exactly one learned component, a fine-tuned flan-t5-large whose only job is reading, and gets everything else — critical values, the test statistic, the accept-or-reject decision, a worked LaTeX solution, and the handful of values a plot is drawn from — out of scipy and string formatting. The chat interface itself is an off-the-shelf ChatGPT-style Next.js template that I adapted; it renders and it plots, and it is not the work this article presents. The work is everything behind it. All of it was trained and run locally on my MacBook Pro, under Python 3.8 and transformers 4.27.4 — the training run's log directory is literally named `Mar20_14-28-00_Dhruvils-MacBook-Pro.local`.

{{component:statguide-demo}}

What follows is the whole build: the text normalization, the four different CSV schemas the dataset passed through, three modeling approaches that failed before the one that worked, the fine-tune itself, and the bug that took a month to find because my evaluation metric was incapable of seeing it. This is also part one of two. The same idea gets rebuilt in a harder form for a second statistics module, and that rebuild, with its own audit, is part two below.

## Two different failures

The first failure was the formula. The course used the small-sample convention where the sample standard deviation gets corrected before it goes into the test statistic:

$$
S = \sqrt{\frac{n}{n-1}} \times s, \qquad T = \frac{\bar{X} - \mu}{S/\sqrt{n}}
$$

GPT-3.5 sometimes used the corrected S, sometimes used the raw s, and sometimes used the population formula with a z statistic on a sample of 25. It had clearly seen all of these in training and had no reason to prefer the one my exam wanted. This is not a knowledge gap you can prompt your way out of, because the model does not know which textbook you are sitting for.

The second failure was arithmetic. Even when it picked the right formula, `(1550 - 1600) / (122.47 / 5)` would come back as something plausible and wrong. Late-2022 models did not run code. They predicted the next token of a number, which is a fundamentally different operation from dividing.

## The design that follows from that

Both failures share a cause: the model was being asked to do things that have exact, deterministic implementations. `scipy.stats.t.ppf` has existed for twenty years and does not hallucinate. So I gave the model exactly one job, the only part of the problem that actually needs language understanding.

Read the word problem. Emit four numbers in a fixed order. Say nothing else.

```
input:  Tests conducted on the breaking strength of 10 pieces of a metal indicated
        an average of 2214.516 kg with a S.D. of 1138.034 kg. Determine if the mean
        breaking strength of the wire can be assumed to be 2165.17 kg, considering
        a 5% level of significance. Extract the values of population mean, sample
        mean, sample size, sample standard deviation in the following order.

output: 2165.17 2214.516 10 1138.034
```

That is the whole contract. Population mean, sample mean, sample size, sample standard deviation, space separated, in that order. No prose, no units, no explanation. Everything downstream is Python.

The last sentence of that input is not part of the user's question. The backend welds it on before the text reaches the model:

```python
inputQ = inputQ + (f' Extract the values of population mean , sample mean , '
                   f'sample size , sample standard deviation in the following order.')
```

Every one of the 3,375 rows in the dataset ends with that same sentence, character for character, including the spaces before the commas. The model has never seen a bare question, so the sentence is not an instruction it interprets. It is a task tag, closer to a mode switch than to a prompt. That distinction turns out to matter when the outputs start going wrong.

## What Python does with those four numbers

The Flask backend splits the model's output on spaces and reads the four values positionally. Everything after that is arithmetic that has a correct answer.

Critical values come from scipy, never from the model:

```python
def calculate_t_value(dof, los, tail_type='one'):
    if tail_type == 'one':
        t_value = stats.t.ppf(1 - los, dof)
    elif tail_type == 'two':
        t_value = stats.t.ppf(1 - los / 2, dof)
    return t_value

def calculate_z_value(los, tail_type='one'):
    if tail_type == 'one':
        z_value = stats.norm.ppf(1 - los)
    elif tail_type == 'two':
        z_value = stats.norm.ppf(1 - los / 2)
    return z_value
```

The level of significance never touches the model either. It is a regex over the question text, because "5% L.O.S." and "level of significance 0.05" are a pattern, not a comprehension problem:

```python
pattern = r'(\d+(\.\d+)?% L.O.S.|level of significance (\d+(\.\d+)?))'
q_LOS = re.findall(pattern, q, re.IGNORECASE)
```

A percentage gets divided down to a proportion by a single guard, `LOS = LOS if LOS < 1 else LOS / 100`, so 5 and 0.05 both arrive as 0.05.

Worth naming now, because it comes back to bite twice: that pattern covers exactly the two phrasings I wrote it against, and quietly fails several it will actually meet. It wants the percent sign glued to the digits, so `5 % L.O.S.`, spaced the way the course PDF spaces it, does not match. And it has no alternative for the number coming before the phrase, so "a 5% level of significance" — the phrasing most of my own training templates use — does not match either. A question the regex cannot parse raises an IndexError inside the extractor, gets caught by the route's blanket except, and comes back to the user as a 500. Keep this function in mind. In part two it becomes a protagonist.

Tail direction is a substring check that collapses to an integer code, where 0 is two-tailed, 1 is left-tailed and 2 is right-tailed:

```python
d1 = 0 if "two tailed" in inputQ.lower() else (
     1 if "left tailed" in inputQ.lower() else 2)
d2 = label_dict['sample size'] - 1
```

A question that names neither phrase — which is nearly all of them, including the bulb question at the top of this article — silently defaults to right-tailed. I will come back to what that means for the bulbs.

Sample size picks the distribution. At 30 or below it uses t with `d2` degrees of freedom, above that it uses z:

```python
T_critical = calculate_t_value(d2, LOS, calculate_k) if n <= 30 \
             else calculate_z_value(LOS, calculate_k)
```

Then the correction and the statistic, in that order, because the corrected S is what goes in the denominator:

```python
S = ((n / (n-1)) ** 0.5) * label_dict['sample standard deviation']
T = (label_dict['sample mean'] - label_dict['population mean']) / (S / (n ** 0.5))
```

The accept-or-reject decision is a branch per tail type, and each branch also selects the inequality that gets rendered as the justification, so the answer shows *why* it landed where it did rather than just asserting it:

```python
if d1 == 0:
    if NHA:
        resultTemplate = "$-T_{critical} < T < T_{critical}$" if n<=30 else "$-Z_{critical} < Z < Z_{critical}$"
    else:
        if T < -1*T_critical:
            resultTemplate = "$T < -T_{critical}$" if n<=30 else "$Z < -Z_{critical}$"
        else:
            resultTemplate = "$T > T_{critical}$" if n<=30 else "$Z > Z_{critical}$"
```

`NHA` is an integer flag: 1 when the null hypothesis is accepted, 0 when it is rejected. The response is assembled as LaTeX with every substitution written out, so what comes back looks like a worked solution rather than a number:

```python
output += f"S = " + "$\\sqrt{\\frac{n}{n-1}}\\times{s}$  = " + \
          (f"$\\sqrt{{\\frac{{{n}}}{{{n-1}}}}}\\times{{{label_dict['sample standard deviation']}}}$" + f" = {S}\n")
```

The last line the backend emits is not for humans:

```python
output += f"\dof{d1}+\dof{d2}+\dof{T_critical}+\dof{T}+\dof{NHA}+\dof"
```

`dof` here is nothing more than a delimiter string unlikely to occur in prose. The chat UI splits the response on it, shows everything before it as the worked solution, and uses the five values — tail code, degrees of freedom, critical value, computed statistic, and the accept flag — to draw the t distribution with the rejection region shaded and a vertical line each at the critical value and the statistic, colored green or red straight off the flag. The UI decides nothing and does no statistics, which is the point of the sentinel: every number it plots was computed on the deterministic side of the fence.

All of that was straightforward. The hard part was getting four reliable numbers into it.

## First the text had to survive being copied

The source questions came out of a PDF of course notes, and pasting from that PDF produced text that looked normal and was not:

```
𝐴 𝑠𝑎𝑚𝑝𝑙𝑒 𝑜𝑓 900 𝑖𝑡𝑒𝑚𝑠 𝑖𝑠 𝑓𝑜𝑢𝑛𝑑 𝑡𝑜 h𝑎𝑣𝑒 𝑎 𝑚𝑒𝑎𝑛 𝑜𝑓 3.47 𝑐𝑚 𝑎𝑛𝑑 𝑆.𝐷. 2.31 𝑐𝑚.
```

Those are Unicode mathematical italic codepoints, not ASCII letters. Every string comparison, every tokenizer and every regex treats them as different characters from the ones they resemble. One line fixes it:

```python
import unicodedata
normalized_text = unicodedata.normalize('NFKC', styled_text)
```

The second normalization problem was vocabulary. The same quantity appears in these questions under at least four names, and the textbook uses "standard error" in places where it means the sample standard deviation. I settled on a fixed mapping applied before anything else touches the text:

```
average       -> mean
μ, 𝜇          -> mean
S.D.          -> standard deviation
standard error-> standard deviation
σ, 𝜎          -> standard deviation
level of significance (lowercase) -> L.O.S.
```

That mapping later became a liability rather than a help, and I dropped it before the flan-t5 work. Collapsing the surface forms shrinks the variety the model sees, and variety in the phrasing is exactly what makes an extractor survive contact with a question somebody else wrote. It was the right call for a bag-of-words model and the wrong call for a sequence model.

## Nine rows, four schemas

The dataset went through four distinct shapes, and each change of shape was forced by a change in the modeling approach rather than by anything about the data.

It started as nine questions I labeled by hand, in `Data.csv`:

```
Text,A,B,C,D
Tests made on the breaking strength of 10 pieces of a metal gave the average as
575.2 kg and a standard error of 8.7025 kg. Test if the mean breaking strength of
the wire can be assumed as 577 kg. Take 5 % L.O.S.,577,575.20000000000005,10,8.7025000000000006
```

The columns are named A, B, C, D because the first approach was spaCy NER, where the column name becomes an entity label and I had not decided what to call them yet. The float noise in `575.20000000000005` is an artifact of the values having passed through a spreadsheet, and it is the first appearance of a theme that runs through this entire project: the exact textual shape of a number matters, and I kept treating it as if it did not.

`Data2.csv` is the same nine rows with the columns renamed:

```
Text,population_mean,sample_mean,sample_size,sample_std_dev
```

That rename happened when I moved from NER to regression, because the columns stopped being entity labels and became named prediction targets.

Nine rows train nothing, so `data_augmented.csv` scaled it to 22,500 rows: 225 paraphrased templates — their origin is two sections down — filled with random values a hundred times each:

```
Text,Population_mean,Sample_mean,Sample_size,Sample_std_dev
"Tests conducted on the breaking strength of 3 pieces of a metal indicated an average
of 1495.7847319289385 kg with a S.D. of 1334.1660410818886 kg. Determine if the mean
breaking strength of the wire can be assumed to be 1477.1615531280008 kg, considering
a 5% level of significance.",1477.1615531280008,1495.7847319289385,3,1334.1660410818886
```

Note the seventeen significant figures. `random.uniform` returns a full-precision float and I wrote it out unrounded, so every question in this file reads like it was measured by an instrument that does not exist. For a regression model that consumes the text as a bag of tokens, this seemed harmless. It was not harmless later.

The fourth schema is the one that trained the model that shipped, `dataLLM.csv`, and it is only two columns:

```
input,output
"Tests conducted on the breaking strength of 10 pieces of a metal indicated an average
of 2214.516 kg with a S.D. of 1138.034 kg. Determine if the mean breaking strength of
the wire can be assumed to be 2165.17 kg, considering a 5% level of significance.
Extract the values of population mean , sample mean , sample size , sample standard
deviation in the following order.",2165.17 2214.516 10 1138.034
```

The four target columns collapsed into one space-separated string, the task tag got appended to every input, and the values got rounded to three decimals. Three of those four changes were correct. The rounding is the bug this article is about.

## Three approaches that did not work

Before any of that, I spent about two months on approaches that treated this as a prediction problem. It is worth walking through them, because the reason they failed is the reason the final design works.

**spaCy named entity recognition.** The obvious framing: the four numbers are entities in the sentence, so train an NER model to tag them. The trouble is that NER wants character offsets, and my labels were values. My first attempt searched for the value in the text:

```python
for label in ['A', 'B', 'C', 'D']:
    value = str(row[label])
    start = text.find(value)
    while start != -1:
        end = start + len(value)
        entities.append((start, end, label.upper().replace(' ', '_')))
        start = text.find(value, start + 1)
```

This tags every occurrence, so a question where the sample mean and the population mean happen to share a prefix produces overlapping spans that spaCy rejects. Worse, `575.20000000000005` from the spreadsheet never appears in a question that reads `575.2`, so those rows silently contributed no entities at all. A later version was worse still, and used the value itself as the character offset:

```python
entities.append((int(row[label]), int(row[label]) + len(str(row[label])), label.upper()))
```

For a population mean of 1477, that asks for characters 1477 through 1481 of a 300-character string. I trained a model on that for 100 iterations with early stopping before noticing.

**Bi-LSTM regression.** The next framing was that the four numbers are continuous outputs, so predict them directly. Embedding, one bidirectional LSTM, one dense layer, mean squared error:

```python
model = Sequential()
model.add(Embedding(input_dim=len(tokenizer.word_index)+1, output_dim=100, input_length=max_len))
model.add(Bidirectional(LSTM(1024, return_sequences=False)))
model.add(Dense(4, activation='linear'))
model.compile(loss='mean_squared_error', optimizer='adam')
model.fit(X_train, y_train, epochs=400, batch_size=100, validation_data=(X_test, y_test))
```

Four hundred epochs at roughly 35 seconds each, so close to four hours of training. The loss curve:

| epoch | train loss | val loss |
|---|---|---|
| 1 | 18,308,544 | 16,331,628 |
| 2 | 16,345,831 | 14,574,575 |
| 397 | 1,294 | 171,253 |
| 400 | 1,216 | 169,396 |

Training loss fell by four orders of magnitude. Validation loss stalled at 169,396, which is a root mean squared error of about 411 per value on targets that range from 0.1 to 10,000. The 139-fold gap between train and validation loss is the model memorizing 18,000 specific questions.

Then I gave it the cable question, where the true values are 1800, 1850, 50 and 100:

```
[[499.57742  454.2979   16.249163  56.036125]]
```

Every value wrong, and a sample size of 16.249163. That output is the argument against the entire approach. A sample size is a count of physical objects, it appears verbatim in the sentence as the token `50`, and the model produced a number with six decimal places that is not close to it. MSE has no way to express "this must be one of the tokens in the input." It only knows that 16.25 is less wrong than 3,000, and it will happily average its way toward the middle of the training distribution.

**Random forest on bag-of-words.** Four separate `RandomForestRegressor` models, one per target, on `CountVectorizer` features, with NLTK preprocessing:

```python
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)
```

That regex keeps letters, digits and whitespace, and deletes everything else. Including the decimal point. `575.2` enters the model as `5752`, and `8.7025` as `87025`. I was destroying the number I was trying to predict, in the first line of preprocessing, on every single row. Stopword removal then stripped the words that carry the relationships, since "of" and "is" and "as" are what distinguish the sample mean from the population mean in "assumed as 577 kg."

I also spent a while on frozen GloVe embeddings, downloading the 5.6GB `glove.840B.300d.txt`, building a 300-dimensional embedding matrix and freezing it under the same bidirectional LSTM. Better word vectors do not help. The problem was never that the model misunderstood "breaking strength."

The problem was the framing. Every one of these treats the four numbers as things to be *predicted*, when they are sitting right there in the input, already written down. The task is not regression or classification. It is copying, with the hard part being which token to copy into which slot. That is a sequence-to-sequence problem, and it wants a sequence-to-sequence model.

## Building the training set

I had 46 real questions: the module's practice sheet plus past exam questions, cleaned up and sitting in one file. That is nowhere near enough to fine-tune anything.

So GPT-3.5 wrote the paraphrases. Each of the 46 went in and came back as roughly five rewrites that preserved the structure but changed the wording, the framing and the domain. A metal breaking strength question became a battery lifespan question, an insurance policyholder age question, a vocabulary retention question. That produced 225 distinct templates with the numeric slots left as placeholders:

```python
f"Tests conducted on the breaking strength of {ss} pieces of a metal indicated an "
f"average of {sm} kg with a S.D. of {sstd} kg. Determine if the mean breaking "
f"strength of the wire can be assumed to be {pm} kg, considering a 5% level of "
f"significance."
```

Worth being honest about what that choice spends. Once paraphrases of the 46 real questions are in the training set, the 46 can no longer serve as a clean held-out set — the model has seen their skeletons, just wearing different clothes. The honest test therefore had to be questions gathered fresh, after training, and that batch of fresh questions is where this article's title comes from.

Python filled the slots, and the filling logic is where the article's bug is hiding in plain sight:

```python
def generate_random_population_mean():
    return round(random.uniform(0.1, 10000), 3)

def generate_random_sample_mean(pm):
    global d
    d = 0
    if 0 < pm < 1:      d = random.uniform(0.1, 0.8)
    elif 1 <= pm < 10:  d = random.uniform(0.1, 1)
    elif 10 <= pm < 100:d = random.uniform(1, 8)
    elif 100 <= pm <= 300:   d = 5
    elif 301 <= pm <= 4000:  d = 6
    elif 4001 <= pm <= 10000:d = 10
    if d == 0:
        d = 0.1
    return round(random.uniform(pm - (pm/d), pm + (pm/d)), 3)

def generate_random_sample_size():
    return random.randint(1, 30)
```

The banded divisor on the sample mean was the one piece of real care in this generator. Drawing the sample mean uniformly would produce questions where a population mean of 3 sits next to a sample mean of 8,000, which no real question does, so the window scales with the magnitude. A population mean of 200 gets a sample mean within a fifth of it, a population mean of 8,000 gets one within a tenth. Standard deviation was drawn between 0.01 and the smaller of the two means.

Fifteen numeric fills per template gave 3,375 rows, split 80/20 into 2,700 train and 675 test, with the task tag appended to all of them. The same 225 templates at a hundred fills each are where the 22,500-row regression file from the previous era came from, so every model in this article, working or not, ultimately ate the same paraphrases.

## Fine-tuning

The base model was `google/flan-t5-large`, 780M parameters, encoder-decoder. A decoder-only model would have worked, but this task is a text-to-text transformation with a short, rigidly formatted target, which is the shape T5 was built for. It also fit on the machine I had.

The CSV went straight into a Hugging Face dataset and got an 80/20 split. Tokenization allowed a long input and a short target, since the questions run to a paragraph and the answer is four numbers:

```python
def preprocess_function(examples):
   inputs = [q for q in examples["input"]]
   model_inputs = tokenizer(inputs, max_length=1024, truncation=True)

   labels = tokenizer(text_target=examples["output"],
                      max_length=128,
                      truncation=True)

   model_inputs["labels"] = labels["input_ids"]
   return model_inputs
```

`DataCollatorForSeq2Seq` handled dynamic padding and set pad positions in the labels to -100 so they are ignored by the loss. The training arguments:

```python
L_RATE = 3e-4
BATCH_SIZE = 5
PER_DEVICE_EVAL_BATCH = 4
WEIGHT_DECAY = 0.01
SAVE_TOTAL_LIM = 3
NUM_EPOCHS = 10

training_args = Seq2SeqTrainingArguments(
   output_dir="./results",
   evaluation_strategy="epoch",
   learning_rate=L_RATE,
   per_device_train_batch_size=BATCH_SIZE,
   per_device_eval_batch_size=PER_DEVICE_EVAL_BATCH,
   weight_decay=WEIGHT_DECAY,
   save_total_limit=SAVE_TOTAL_LIM,
   num_train_epochs=NUM_EPOCHS,
   predict_with_generate=True,
   push_to_hub=False
)
```

2,700 examples at batch size 5 is 540 optimizer steps per epoch, so ten epochs came to 5,400 steps. `predict_with_generate=True` means each evaluation actually decodes rather than just scoring teacher-forced logits, which is the honest way to measure this task and also the expensive one. A single eval pass over 675 examples took around 700 seconds, so the ten evaluation passes accounted for nearly two hours on their own. The whole run took 28,985 seconds — a shade over eight hours of a laptop doing nothing else.

For the metric I used ROUGE, computed through `evaluate`, with the standard newline-per-sentence handling for rougeLsum:

```python
decoded_preds = ["\n".join(nltk.sent_tokenize(pred.strip())) for pred in decoded_preds]
result = metric.compute(predictions=decoded_preds, references=decoded_labels, use_stemmer=True)
```

That was a mistake I did not notice for weeks. ROUGE measures n-gram overlap between two pieces of text. The target here is `2165.17 2214.516 10 1138.034`. There is no summary to score, stemming a numeric string does nothing, and an output that gets three of four values right scores around 0.75 while being completely unusable, because the backend will happily compute a test statistic from it. The right metric was exact match on all four fields, or per-field accuracy. I was measuring partial credit on a task that has none.

The loss curve looked like a clean run:

| epoch | eval loss | ROUGE-1 |
|---|---|---|
| 1 | 0.1319 | 0.9877 |
| 2 | 0.0490 | 0.9932 |
| 3 | 0.0395 | 0.9934 |
| 4 | 0.0510 | 0.9960 |
| 7 | 0.0472 | 0.9951 |
| 9 | 0.0627 | 0.9913 |
| 10 | 0.0611 | 0.9928 |

Training loss fell from 0.1255 at step 500 to 0.0018 at step 5000. Eval loss bottomed out at epoch 3 and then drifted upward through the back half of the run, which is ordinary overfitting on a 2,700-row set with 780M parameters behind it.

Which brings up the second mistake, still visible in the folder. `save_total_limit=3` keeps the three most recent checkpoints and deletes the rest, and I never set `load_best_model_at_end`. So the three that survived were steps 4000, 4500 and 5000, at epochs 7.4, 8.3 and 9.3. The best model, epoch 3 at 0.0395, had already been deleted by the time training finished. The checkpoint the Flask backend loads is `checkpoint-5000`, and the evaluations nearest it scored 0.0627 and 0.0611 — call it more than fifty percent worse than the model the run actually produced. I picked it for the least defensible reason available: it was the highest number in the directory.

### What it actually output

Loading that checkpoint and giving it a question in the training distribution:

```python
last_checkpoint = "./results/checkpoint-5000"
finetuned_model = T5ForConditionalGeneration.from_pretrained(last_checkpoint)
tokenizer = T5Tokenizer.from_pretrained(last_checkpoint)

inputQ = ("A metal's breaking strength was tested using 6 pieces, yielding an average of "
          "7825.654 kg and a standard deviation of 2238.029 kg. Assess whether the mean "
          "breaking strength can be accepted as 8437.92 kg with a 5% level of significance. "
          "Extract the values of population mean , sample mean , sample size , sample "
          "standard deviation in the following order.")

input2 = tokenizer(inputQ, return_tensors="pt")
outputs = finetuned_model.generate(**input2)
answer = tokenizer.decode(outputs[0])
```

```
<pad> 8437.92 7825.654 6 2238.029</s>
```

Exactly right, and worth reading carefully. The model did not emit them in the order they appear in the question. The text mentions the sample mean first and the population mean third; the output puts the population mean first, because that is the order the task tag asks for. It learned the slot assignment, not the reading order. That is the entire skill I wanted, and on this class of question it has it.

The raw decode includes the `<pad>` prefix and the `</s>` terminator, which is why the backend shaves them before parsing, and this is also where the four positions get their names:

```python
s = s.lstrip('<pad> ')
s = s.rstrip('</s>')
s = s.split(' ')
s = [check(no) for no in s]

label_dict['population mean'] = s[0]
label_dict['sample mean'] = s[1]
label_dict['sample size'] = s[2]
label_dict['sample standard deviation'] = s[3]
```

There is no validation in that sequence. Nothing checks that exactly four values came back, or that each one parses as a number.

The second test in the same notebook is where it starts to show. This question has a lot of distractor prose, and all four of its values are whole numbers:

```
"A language learning app claims to improve vocabulary retention compared to a
historical average improvement of 27 words... For the app users assum sample size
as 29, the average vocabulary improvement is 21 words with a standard deviation
of 11 words..."
```

```
<pad> 27 21 21 29 11</s>
```

Five values instead of four. The correct answer is `27 21 29 11`, and the model emitted `21` twice. Feed that into the backend and `s[2]` becomes 21, so the sample size is 21 rather than 29, the degrees of freedom become 20 rather than 28, and `s[3]` becomes 29 rather than 11 so the standard deviation is wrong too. Nothing raises. You get a clean, well-formatted, confidently wrong worked solution.

The third test, also all whole numbers, came back perfect:

```
"...They post 19 photos... average number of likes for photos is 1501 likes with a
standard deviation of 371 likes... assuming average number of likes on videos to
be 2183 likes."
```

```
<pad> 2183 1501 19 371</s>
```

So at the end of the fine-tune I had a model that was right on the third question and quietly wrong on the second, with no way to tell which from any number I was tracking.

One more thing bites at inference. `model.generate()` defaults to `max_length=20` tokens, and the notebook prints that warning on nearly every call. Four three-decimal numbers can tokenize past twenty subword pieces, so the default silently truncates the answer. The backend sidesteps it:

```python
outputs = finetuned_model.generate(**input2, max_new_tokens=500000)
```

## Then it met a real question

The honest test was a batch of fresh questions, written and collected after training, that no paraphrase of had ever entered the dataset. The first thing I got wrong was the task tag. I typed it from memory instead of copying it, so the model received

```
Extract the numerical values of the population mean , sample mean , sample size
and sample standard deviation provided in the question in the following order.
```

rather than the string it was trained on:

```
Q: ...first 13 students... average completion rate is 81 with a standard
   deviation of 19... compared to a historical average of 33?

A: 33.33 811.618 13 19
```

Thirty-three became 33.33. Eighty-one became 811.618. Sample size, 13, was correct.

Fixing the tag did not fix the numbers. With the training tag, character for character:

```
Q: ...random sample of 31 energy bars... sample mean protein content is 22 grams,
   with a standard deviation of 3 grams. The energy bars claim to contain 20 grams...

A: 22.79 22 22.31 3 3
```

Five values, two of them decorated with invented decimals, on the exact string the model saw 3,375 times. Neither did dropping the tag entirely. Across fifteen fresh questions run with no tag at all, six came back clean and nine were wrong, and the split had nothing to do with the tag:

```
Q: ...increase focus by at least 20... sample of 60... average increase 25
   with a standard deviation of 5

A: 20 2547.525 60 5.001
```

```
Q: ...wait time under 20 minutes... 50 customers... 18.5 minutes,
   standard deviation 3

A: 1704.5 18.5 50 3
```

```
Q: ...average download speed at least 50 Mbps... 100 users... 52.5 Mbps,
   standard deviation 8

A: 5059.52.5 52.5 100 8 0.01
```

```
Q: ...improve flexibility by at least 15... 40 participants... 18 with a
   standard deviation of 2.5

A: 15 18 with 2.5
```

That last one emitted the English word "with" in a numeric slot.

Two things break here. The values are wrong, and the count is wrong. As with `27 21 21 29 11`, a five-token output does not just give a bad answer, it shifts every field by one and computes a confident test statistic from garbage.

Then two results told me what was actually happening:

```
Q: ...average waiting time 4.8 minutes...    A: 5 4.855 35 1.2
Q: ...average loading time 2.8 seconds...    A: 3 2.826 26 0.5
```

4.8 became 4.855. 2.8 became 2.826. These are not integers. They are floats that got wrong anyway, and both were wrong in the same direction: the model kept the digits it read and then invented enough extra digits to reach three decimal places.

Meanwhile these came back exactly right, with no tag and no help:

```
Q: ...503.39 grams... 36... 231.1 grams... 10.12 grams
A: 503.39 231.1 36 10.12

Q: ...50000 per year... 60 graduates... 52500... 7000
A: 50000 52500 60 7000
```

So it was never a clean rule. Whole numbers were the worst case, not the only case, and plenty of whole numbers survived. What the successes and failures had in common was something about the number of digits after the decimal point.

## Every label in the set had the same shape

I ran one count over the 3,375 training rows, checking whether each of the four output fields contained a decimal point.

Every single row had the shape float, float, integer, float. All 3,375. Field 2, sample size, was an integer in every row, and it is the field the model got right most reliably. Fields 0, 1 and 3 were floats in every row, and those are the three that broke.

The generator explains it in one line:

```python
def generate_random_population_mean():
    return round(random.uniform(0.1, 10000), 3)
```

`random.uniform` returns an integer with probability zero. Rounding to three decimals does not change that. Across 10,125 float labels, the model never once saw a whole number in those positions.

The count that actually explains the failures is the one on decimal places. Of those 10,125 labels, 9,152 had exactly three digits after the point, 885 had two, and 88 had one. Not a single one had zero.

So the model did not learn "copy the number you find in the text." It learned "fields 0, 1 and 3 have about three decimal places, field 2 is a whole number." Every wrong answer is that rule being applied: 4.8 padded to 4.855, 2.8 padded to 2.826, 25 rewritten as 2547.525, 50 as the malformed 5059.52.5. The cases that came back clean, 503.39 and 231.1 and 10.12, were already shaped like the training labels. 50000 and 52500 survived because they are long enough to look like one.

This is also why the failures were intermittent rather than absolute. The model had a strong prior about output shape and a weaker, competing signal telling it to copy what it read. Whichever won on a given question decided whether the answer was right.

The ROUGE the run peaked at, 0.9960, could not see any of this, because the evaluation set was generated by the same script and carried the same defect. Both sides of the comparison agreed that numbers have three decimals.

## The coin flip

The fix is one line of policy in the generator: every float field flips a coin at generation time, and half of them become whole numbers. A question that reads "an average of 82 kg" then carries 82 as its label, and one that reads "82.413 kg" carries 82.413, because the same value is formatted once and substituted into both the text and the label. That is the fix, and it is the only real one, because the wrong thing lives in the weights. The model has a prior over output shape, and the only way to change that prior is to change what it was trained on. There is no patching it at inference time.

I should be equally plain about what happened next, because the project's artifacts are unambiguous: I never retrained this model. There is exactly one fine-tuning run in this project's history, the eight-hour March one, and `checkpoint-5000` from it — three-decimal prior and all — is still the model the backend loads. The coin flip shipped, but it shipped in the *next* project's data generator, for a different statistics module, which is what part two of this article is about.

What I did add here is a normalizer on the backend, on the principle that the parser should not trust the model:

```python
def check(no):
    no = float(no)
    if no - int(no) > 0:
        return no
    return int(no)
```

That collapses 13.0 to 13 before it becomes a sample size or a degrees-of-freedom value, and it is what lets the same code path handle `10` and `10.0` from the model without branching. It is a second line of defense, not the fix. It cannot recover 81 from 811.618.

## Back to the bulbs

The question that opened this article deserves its answer. Given the four numbers in the right order — 1600 1550 25 120 — the deterministic half does exactly what the course wants. S = √(25/24) × 120 = 122.4745. T = (1550 − 1600) / (122.4745/5) = −2.0412. Read "is the claim acceptable" as two-tailed, the way the course does, and the critical value is t₀.₀₂₅,₂₄ = 2.0639; since |−2.0412| < 2.0639, the claim stands. The backend, for what it is worth, reaches the same verdict by a lazier route: the question names no tail, so the code defaults to right-tailed, gets t₀.₀₅,₂₄ = 1.7109, finds −2.0412 < 1.7109, and accepts. Same answer, less defensible reasoning, and a reminder that the deterministic side has its own quiet defaults. Either way, both of GPT-3.5's failures from the top of the article are gone from this half: the formula is pinned in code, and the arithmetic is scipy's.

Whether the model *delivers* those four numbers is the other half, and I cannot show you that it does, because no notebook in the project ever ran the bulb question through the extractor. Looking at it now, it would have been the sternest test available: 1600, 1550, 25, 120 — every value a whole number, the exact shape the training labels never contained. A pipeline whose deterministic half is bulletproof still answers with whatever four numbers the reading step hands it, and on this question I genuinely do not know what those would have been. That is not a rhetorical shrug. It is the precise size of the hole this article is about.

## What I took from it

The format of your labels is a feature, whether or not you meant it to be. I thought I was teaching the model to find numbers in text. I was also teaching it, silently and with total consistency, how many decimal places a number has. A generator that samples continuously will never emit a whole number, and a model trained on it will never emit one either.

Pick a metric that can fail. ROUGE gave partial credit on a task where three correct values out of four is a wrong answer that still runs, and it stayed above 0.98 through every version of the bug in this article. Exact match on all four fields would have read somewhere near zero on real questions and sent me looking a month earlier. A metric that cannot go down is not measuring anything.

Held-out accuracy measured against synthetic data only tells you the model learned the generator. Mine peaked at 0.9960 ROUGE-1 on data drawn from the same script, then got nine of fifteen fresh questions wrong, because real questions are written by humans who round to 81 and 4.8, not 811.618 and 4.855. A handful of genuinely fresh questions found what 675 synthetic ones could not — and they were the only honest test available, because the 46 real questions I started with had already been spent as paraphrase seeds for the training set.

Validate at the boundary. The backend reads `s[0]` through `s[3]` off a split string with no length check, so `27 21 21 29 11` produces a beautifully typeset solution to a problem nobody asked. Four lines asserting that the model returned exactly four parseable numbers would have turned every shifted-field failure into an error instead of an answer. Not the wrong-value failures — `20 2547.525 60 5.001` is four parseable numbers and passes any count check. Validation catches malformed output. Nothing catches wrong output, which is why the training data had to change.

Treat the task tag as part of the format, not as a prompt. Because that string was appended to all 3,375 rows and never varied, retyping it from memory changed the input in a way no amount of careful wording could fix. Anything constant across your entire training set is structure the model depends on, and it should live in one constant that both the generator and the server import. In this project the generator's copy and the server's copy happened to match. The next one was not so lucky.

There is one more gap I should name because I never closed it. `random.randint(1, 30)` capped training sample sizes at 30, and the backend switches from t to z at exactly n greater than 30, so the z branch never had a question the model was trained for. The fresh-question results complicate that story in an interesting way: sample size was the field the model kept getting *right*, at 35, 50, 60 and 100, well outside anything it ever saw. The gap turned out to be benign everywhere I could observe it. But nothing entitled me to expect that, and I only know it because fresh questions happened to probe it — which is the held-out-data lesson again, from a different angle.

The broader move still holds up, and it is the part I would do again without changing anything. If part of your problem has an exact implementation, do not ask a language model to approximate it. Ask the model to read, hand the numbers off, and let `scipy.stats.t.ppf(0.975, 12)` return 2.1788128296634177 every time.


---

## Part two: the model stops typing numbers

Part one ended with a fix I could describe in one line and never applied to that model. The generator learned to flip a coin; the t-test extractor was never retrained. Partly that was an eight-hour training run I did not want to repeat. Mostly it was a suspicion that had been growing through the whole postmortem: even the fixed dataset only shrinks the problem, it does not remove it.

Suppose the retrain had happened and the three-decimal prior was gone. What remains is a decoder emitting digits one at a time from a distribution. Nothing in the architecture ties the digits it writes to the digits it read. Training can make that tie extremely likely. It cannot make it certain, and a statistics answer built on a value that is probably right is not an answer.

So for the next module, I stopped asking for the numbers.

## A different module, and a second kind of ambiguity

The sequel is a different test. This one is the F-test for equality of two variances, where the question gives you two samples and asks whether they could have come from populations with the same variance:

> A sample of size 34 gave an estimated population variance of 19.79, while another sample of size 15 gave an estimated variance of 22.5. Could both samples be from populations with the same variance, test it at 5% L.O.S.

Four numbers again, two sizes and two variances, and the same statistic to compute. But this module introduces something the t-test version never had to represent. The second quantity in each sample is not always a variance. Half the questions give you the sum of the squares of the deviations from the mean instead:

> Two samples of size 9 and 8 and the sum of the squares of the deviations from the mean form a square of 160 and 91 respectively. Can this be a drift from the same population at level of significance 0.05 ?

160 is not a variance. It becomes one after you divide by n - 1. So a number sitting in the second slot of the first sample can mean two different things depending on the sentence around it, and getting that wrong is not a rounding error, it is a factor of eight.

That distinction has to be made by something that reads English. It is the one part of this problem a regex cannot do, and it is the reason the model is still here at all.

## The move: the numbers go in, the labels come out

The old contract was "read the question, write four numbers." The new one inverts it. Python extracts the numbers, the model names them, Python puts the names and the numbers back together.

The backend pulls every numeric token out of the question with the same pattern the augmentation script uses, normalizes each one, and drops the level of significance:

```python
L = re.findall(
    "[-+]?[.]?[\d]+(?:,\d\d\d)*[\.]?\d*(?:[eE][-+]?\d+)?", inputQ)
L = [check(no) for no in L]
L.remove(extractLOS(inputQ))
```

`check` is the same three-line normalizer from part one, the one that collapses 13.0 to 13. `extractLOS` is the same regex. Both were written for the previous project and both carry forward unchanged, which turns out to matter twice, in different ways.

Then that list is welded onto the question and handed to the model:

```python
inputQ = inputQ + \
    f'Classify each of the following values in {L} as Sample 1 size  , Sample 1 variance  / Sample 1 sum of squared deviations , Sample 2 size  , Sample 2 variance  / Sample 2 sum of squared deviations.'
```

Look closely at that string, because it is not quite the one the training data uses. I did not look closely either. Hold that thought for a few sections.

A complete training row looks like this:

```
input:  A teacher suspects that scores on a standardized test may vary more widely
        between boys and girls. A random sample of 183 boys has a sum of squared
        deviations from the mean of 183.434.  A separate random sample of 42 girls
        has a estimated variance of 20. Could these scores indicate a statistically
        significant difference in variance between boys and girls scores at a 5%
        L.O.S. ? Classify each of the following values in [183, 183.434, 42, 20] as
        Sample 1 size  , Sample 1 variance or Sample 1 sum of squared deviations ,
        Sample 2 size  , Sample 2 variance or Sample 2 sum of squared deviations.

output: Sample 1 size , Sample 1 sum of squared deviations , Sample 2 size , Sample 2 variance
```

No digit appears in the target. Position 0 of the list is a sample size, position 1 is a sum of squared deviations, position 2 is a sample size, position 3 is a variance. The value 183.434 never passes through the decoder, so the decoder cannot round it, pad it, or invent a fourth decimal for it. It came out of the user's own text through a regex and it goes into `scipy` through an index.

The entire class of error that part one was about is now unreachable. Not less likely. Unreachable.

What is left is the alignment, and that is genuinely a reading problem. The label sequence follows the order the values appear in the question, not a fixed slot order, so the model has to track which sample is being described and which of the two quantities the sentence is naming. Some templates put both sizes first:

```
The gardener wanted to see if two composting methods affect the variability of
vegetable yield. They plant vegetables in plots amended with compost from Method A
125 plots and Method B 85 plots. Method A plots have a total deviation from the mean
squared of 191.477. ... Method 2 having sum of squared deviations 131.814 ...

-> Sample 1 size , Sample 2 size , Sample 1 sum of squared deviations , Sample 2 sum of squared deviations
```

I had written the shape of this down months earlier, in a design-notes file, as two competing designs. Option 1 was a four-label set with the variance/sum-of-squares question resolved by a substring check on the backend:

```python
if 'sum of the squares of the deviations' in Q:
    L[ L.index('Sample 1 variance') ] = L[ L.index('Sample 1 variance') ] / (L[ L.index('Sample 1 size') ] - 1)
```

Option 2 puts the distinction in the label set itself and lets the model decide. Option 2 shipped, because the substring check only works while every question is phrased the way the textbook phrases it, and the whole point of the paraphrase generator is that they are not.

## What Python does with a list of label names

The output comes back as a comma-separated string, gets split, and is zipped against the numeric list by position:

```python
s = s.lstrip('<pad> ')
s = s.rstrip('</s>')
s = s.split(' , ')
for i in range(len(L)):
    label_dict[s[i]] = L[i]
```

Then the sum-of-squares conversion, which is the one piece of arithmetic that depends on what the model said rather than what it read:

```python
if ('Sample 1 sum of squared deviations' in s) or ('Sample 1 sum of squared deviation' in s):
    ...
    label_dict['Sample 1 variance'] = (L[temp] /(L[s.index('Sample 1 size')] - 1))
```

After that the code does not care which form the question used. Both branches end with a variance in `label_dict`, and the F statistic is the larger over the smaller, with the degrees of freedom following whichever went on top:

```python
if label_dict['Sample 1 variance'] > label_dict['Sample 2 variance']:
    F = (label_dict['Sample 1 variance'] / label_dict['Sample 2 variance'])
    d1 = label_dict['Sample 1 size'] - 1
    d2 = label_dict['Sample 2 size'] - 1
else:
    F = (label_dict['Sample 2 variance'] / label_dict['Sample 1 variance'])
    d1 = label_dict['Sample 2 size'] - 1
    d2 = label_dict['Sample 1 size'] - 1
```

The critical value comes from scipy and nowhere else, one-tailed at the full level of significance, which is the convention the course used with the larger variance in the numerator:

```python
def calculate_f_value(dof1, dof2, los):
    f_value = stats.f.ppf(1 - los, dof1, dof2)
    return f_value
```

Reject if F exceeds it, accept otherwise. There is also a `calculate_p_value` that returns `1 - stats.f.sf(F, d1, d2)`, which is the CDF rather than a p-value, and which is computed, printed to the console, and never used in the response. It is dead code and it has been dead since I wrote it.

On the other side of the sentinel, nothing conceptually changed. The backend still ends its response with the same machine-readable line, now carrying the F statistic and its critical value in place of T's, and the chat UI draws the central-F density instead of the t, rejection region shaded, one line per value, green or red off the flag. It still decides nothing and does no statistics.

## The dataset

274 templates, 13 numeric fills each, 3,562 rows, split 2,849 train and 713 test. Two columns, `input` and `output`, same as before. The seeds this time were four real questions from the module's notes — they sit at the bottom of the same design-notes file as the two options — run through the same GPT-3.5 paraphrase mill as part one's 46.

The generators carry the lesson from part one, and this is the part I would defend without changes. Every quantity that can be a whole number sometimes is one:

```python
def generate_sample_variance():
    toss = random.uniform(0, 1)
    return round(random.uniform(0.1, 100),3) if toss < 0.5 else random.randint(1, 100)

def generate_sample_sum_of_squared_deviations():
    toss = random.uniform(0, 1)
    return round(random.uniform(0.00099999, 100),3) if toss < 0.334 else ( round(random.uniform(1.0000000001, 200),3) if toss < 0.667 else random.randint(1, 200) )

def generate_sample_size():
    return random.randint(1, 200)
```

Counting the finished file, sample 1 variance is a whole number in 928 rows and a decimal in 970. The sum of squared deviations is a whole number in roughly a third of its rows, which is what the three-way toss asks for. Sample 1's size slot is an integer in 3,551 of 3,562 rows, and sample 2's in 3,544.

Both of those numbers should be 3,562. `generate_sample_size` returns `random.randint(1, 200)` and cannot produce anything else, so 29 rows have a decimal sitting where a sample size belongs, and 29 rows are wrong. I will come back to those.

The label is built from the template, not from the text, by reading the placeholder names in order:

```python
def output(q):
    pattern = r'\{(\w+)\}'
    label_dict = { 's1s' : 'Sample 1 size' , 's2s' : 'Sample 2 size' , 's1v' : 'Sample 1 variance' , 's2v' : 'Sample 2 variance' , 's1sosd' : 'Sample 1 sum of squared deviations' , 's2sosd' : 'Sample 2 sum of squared deviations' }
    result = re.findall( pattern , q )
    result = [ label_dict[ i ] for i in result ]
    return result
```

This is a good idea with one consequence I did not think through. The label is derived from the placeholders and the input list is derived from the rendered text, and the two are only guaranteed to agree if nothing disturbs the list between rendering and writing. Two things disturb it, and both get counted in "Counting the training set again" below.

There is also a fact about this dataset that changes what the task is. Six label names, four positions, and the whole training set contains exactly **ten distinct output strings**. Four of them cover 3,484 rows, or 97.8%:

| output | rows |
|---|---|
| size, variance, size, sum of squares | 1,079 |
| size, sum of squares, size, sum of squares | 949 |
| size, variance, size, variance | 806 |
| size, sum of squares, size, variance | 650 |
| six other orderings | 78 |

This is a sequence-to-sequence model doing four-way classification. I did not design it that way, I arrived at it, and the fact that I did not notice until I ran the value counts is a large part of why the metric fiasco two sections down was possible.

## Fine-tuning, same recipe

`google/flan-t5-large` again, same tokenizer, same collator, same 80/20 split. The only changes to the training arguments are four epochs instead of ten and a longer label budget:

```python
labels = tokenizer(text_target=examples["output"],
                   max_length=512,
                   truncation=True)
```

```python
NUM_EPOCHS = 4
```

2,849 examples at batch size 5 is 570 steps per epoch, 2,280 total. Training took 15,245 seconds, a little over four hours. Each evaluation pass over 713 examples took between 873 and 900 seconds, so the four evals added another hour on their own.

| epoch | eval loss | ROUGE-1 |
|---|---|---|
| 1 | 0.0011159 | 0.904477 |
| 2 | 0.0015709 | 0.9046948 |
| 3 | 0.0000012 | 0.9046948 |
| 4 | 0.0000005 | 0.9046948 |

Training loss went 0.0173, 0.0024, 0.0002, 0.0 at steps 500, 1000, 1500 and 2000. Eval loss ended at 5.09e-07, which for a task with ten possible answers means the model has memorized the mapping.

Look at the ROUGE column. Epochs 2, 3 and 4 are identical — not close, identical, to all sixteen decimal places the trainer logs. The eval loss fell by three orders of magnitude across those same rows and the metric did not move by one part in 10^15, which can only happen if the decoded predictions were byte-for-byte the same on every one of the 713 test examples across three evaluations.

I left `load_best_model_at_end` unset again, and `save_total_limit=3` again, so the surviving checkpoints are 1000, 1500 and 2000, at epochs 1.75, 2.63 and 3.51. The final model at step 2,280 was never written to disk. This time it cost me less, because eval loss was falling monotonically after epoch 2 and `checkpoint-2000` sits just before the best measurement, and it is the one the Flask backend loads.

The notebook that runs the inference tests loads `checkpoint-1500` instead, which is the checkpoint saved right after the worst eval loss in the run. Nobody chose that. It is what was in the cell.

## The metric could not have failed

Part one ended with "pick a metric that can fail." I used ROUGE again anyway, unchanged, and on this dataset it is worse than it was on the last one.

Every valid output is built from the same six label names, which are built from the same handful of words. Compute unigram overlap between the two most confusable labels in the set, the ones that differ by whether sample 1's second value is a variance or a sum of squares, and you get **0.8485**. Those two are entirely different answers. One of them divides by n - 1 and the other does not. ROUGE calls them 85% the same.

Across all ten valid outputs, no pair scores below **0.67**. A model that answered every question with the single most common label would still score in the eighties. The usable range of this metric on this task is the top third of the dial, and the number I was watching sat at 0.9047.

Then there is why it sat at 0.9047 rather than 1.0 while the eval loss was 5e-07.

`predict_with_generate=True` means each eval actually decodes. Decoding uses the generation config, and the generation config's `max_length` default is 20. It is the same default that printed a warning on every call in the previous project, the one I fixed in the backend with `max_new_tokens=500000` and never fixed anywhere else.

Twenty tokens is not enough. Running the labels through the checkpoint's own sentencepiece model:

| output | pieces + eos | fits in 20? |
|---|---|---|
| size, variance, size, variance | 19 | exactly |
| size, sum of squares, size, variance | 24 | no |
| size, sum of squares, size, sum of squares | 29 | no |

The all-variance label is exactly 20 tokens once you count the decoder start token. It is the only one of the four common labels that fits, and it fits with zero to spare. Everything else was cut off mid-answer during every evaluation of the run.

Truncating any of the long labels to the 19 content tokens the budget allows gives this:

```
Sample 1 size , Sample 1 sum of squared deviations , Sample 2 size
```

Which is exactly, character for character, what the notebook's two inference cells printed:

```
<pad>Sample 1 size, Sample 1 sum of squared deviations, Sample 2 size
```

Both test questions. Both stopping at the same place. Not a model failure, a decode budget, and the model was almost certainly right about the fourth label it never got to say.

Simulating the metric under that constraint, scoring every label against itself-truncated-to-19-tokens, gives a mean ROUGE-1 of **0.903** across the dataset. The trainer reported 0.9047 on its test split. The truncation reproduces the plateau to within a couple of thousandths.

So the frozen number was not the model converging. It was the generation cap, which is deterministic, applied to a converged model, which is also deterministic. The metric had stopped measuring the model after epoch 2 and started measuring `max_length=20`.

The backend, meanwhile, passes `max_new_tokens=500000` and has never been truncated once. The shipped model and the evaluated model were not producing the same outputs, and the one I had numbers for was the one nobody uses.

## Counting the training set again

Part one found its bug by running one count over the labels. Same move here, and the data is worse than I expected.

**The level of significance takes the wrong number with it.** `L.remove(extractLOS(q))` removes by value, and `list.remove` deletes the first match. When the level of significance is 5% and some quantity in the question also happens to be 5, the first 5 in the list is the quantity, not the significance level. 100 of 3,562 rows have this collision. Here is one:

```
An analyst hypothesizes that there might be a difference in the daily sales
variability between two stores. A random sample of 174 days from store A has a sum
of squared deviations from the mean of 5, and a separate sample of 67 days from
store B has an estimated variance of 26.449. Can we conclude at the 5% L.O.S. ...

list:  [174, 67, 26.449, 5]
label: Sample 1 size , Sample 1 sum of squared deviations , Sample 2 size , Sample 2 variance
```

The sum of squared deviations, 5, was deleted. The 5 that survived at the end of the list is the level of significance. So this row teaches the model that 67 is sample 1's sum of squared deviations, that 26.449 is a sample size, and that the significance level is sample 2's variance. Every value shifted one place left and the label did not move with it.

Twenty-nine of those rows are provable from the file alone, because a sample size slot ends up holding a decimal and `generate_sample_size` only ever returns integers. The other seventy-one are the same corruption landing somewhere it does not leave a signature.

**The ordinals in the prose become data.** Most templates say things like "Factory 1" and "Factory 2", and the number extractor cannot tell those from measurements, so the list comes out with six or seven entries. The patch:

```python
if len(L) > 4:
    if 1 in L:
        L.remove(1)
    if 2 in L:
        L.remove(2)
```

Also removal by value, also first match, and `generate_sample_size` returns `random.randint(1, 200)`, so a genuine sample size of 1 or 2 is a value this code will delete. One of the twenty-nine scrambled rows is exactly that: Route B has 1 package, the question is at a 1% level of significance, and by the time both removals have run the list is short one sample size and long one significance level.

**Sample sizes of 1 exist.** 26 rows in the finished dataset hold a sample size of 1, which gives zero degrees of freedom, and `sum_of_squares / (n - 1)` is a division by zero. Nothing in the generator excludes it and nothing in the backend checks for it.

**Three templates are mislabeled at the source.** One says "the sum of the squares of the deviations from the mean form a square of {s1v} and {s2v}", using the variance placeholders for a quantity the sentence explicitly calls a sum of squares, so thirteen rows tell the model that a sum of squares is a variance. Two others use `{s2sosd}` where they meant `{s1sosd}`, which produces both a wrong label and a question in which both samples report the identical value:

```
Lunch service data from 35 days shows a sum of squared deviations from the mean of
123.413 in wait times. Dinner service data from 48 days shows a sum of squared
deviations from the mean of 123.413 in wait times.
```

Those three templates are the source of six of the ten distinct outputs, which is why the tail of that distribution is thirteen rows wide each — thirteen fills, one template. The rare classes in this dataset are not rare phrasings. They are typos.

**60 rows contain a duplicate value in the list**, from that template and from ordinary collisions, and `label_dict[s[i]] = L[i]` is keyed by label name, so if the model ever emits the same label twice the second write silently overwrites the first and the dictionary comes out one key short.

## The tag drifted again

Part one closed with a lesson about the appended instruction: it is structure, not a prompt, and it should live in one constant that the generator and the server both import.

I did not do that. The generator writes:

```python
prompt = f' Classify each of the following values in {L} as Sample 1 size  , Sample 1 variance or Sample 1 sum of squared deviations , Sample 2 size  , Sample 2 variance or Sample 2 sum of squared deviations.'
```

The backend writes:

```python
inputQ = inputQ + \
    f'Classify each of the following values in {L} as Sample 1 size  , Sample 1 variance  / Sample 1 sum of squared deviations , Sample 2 size  , Sample 2 variance  / Sample 2 sum of squared deviations.'
```

Two differences. The generator's string starts with a space and the backend's does not, so every production request reads `...5% L.O.S. ?Classify each of the following` with the tag fused to the question mark. And the word `or` between the two alternatives became `  /` on the server, in both places. The model has seen `variance or Sample 1 sum` 3,562 times and `variance  / Sample 1 sum` zero times. This is the string I asked you to hold onto several sections ago.

The notebook's own test cells use the `or` form, which is why they behave. The server is the only thing that sends the slash, and the server is the only thing users touch.

The slash version is not something I mistyped. It is in the design-notes file, written as Option 2's prompt sketch before the generator existed, and it got copied into `routes.py` from there while the generator was written from the other note. Both files are faithful to a source. They are faithful to different ones.

**The other half of the same problem: more than half the training questions crash the server before the model is called.** `extractLOS` in the augmentation script was extended to handle three more phrasings:

```python
pattern = r'(\d+(\.\d+)?% L.O.S.|level of significance (\d+(\.\d+)?)|L\.O\.S\. of (\d+(\.\d+)?)%|L\.O\.S\. of (\d+(\.\d+)?))'
```

`routes.py` still has the original two-alternative pattern from the previous project — the one whose blind spots part one already flagged. Only 1,521 of the 3,562 training rows say "at a 5% L.O.S." The other 2,041, 57% of the set, say "at a L.O.S. of 10%" or "at a L.O.S. of 0.01", and the backend's regex matches neither. `q_LOS[0]` raises `IndexError` on an empty list, the `except` catches it, and the user gets `{"error": "An error occurred"}` and a 500. More than half the distribution I trained on cannot reach the model in production.

Same failure as the tag, same cause. One function, two copies, one of them improved.

## Three bugs at the parse boundary

Part one's closing advice was to validate at the boundary. The boundary in this version is four lines long and every one of them does something quietly wrong.

```python
s = s.lstrip('<pad> ')
s = s.rstrip('</s>')
s = s.split(' , ')
```

`str.rstrip` takes a set of characters, not a suffix. `'</s>'` is the set `{<, /, s, >}`, and the last label in a large fraction of outputs is `Sample 2 sum of squared deviations`, which ends in `s`. So the strip eats the terminator and then keeps going and eats the plural. The evidence that this happened is the code immediately below it:

```python
if ('Sample 2 sum of squared deviations' in s) or ('Sample 2 sum of squared deviation' in s):
    if 'Sample 2 sum of squared deviations' in s:
        temp = s.index('Sample 2 sum of squared deviations')
    else:
        temp = s.index('Sample 2 sum of squared deviation')
```

I hit the singular form, could not work out where it came from, and wrote a branch for it. There is an earlier copy of the whole app, a folder called `UI-OLD-2` that I kept next to the live one, and its version of this file only checks the singular — which means at that point every output was arriving with the `s` shaved off and I had concluded that was just the format. `lstrip('<pad> ')` has the same character-set behavior and gets away with it because every label starts with a capital S.

The split is the third one. Training labels are joined with `' , '.join(correct_class)`, so the target text really does have spaces on both sides of the comma, and raw sentencepiece decoding preserves that. The transformers tokenizer does not. `decode` cleans up spacing before punctuation by default, which is why the notebook prints

```
<pad>Sample 1 size, Sample 1 sum of squared deviations, Sample 2 size
```

with the commas closed up. `routes.py` splits on `' , '`. The older copy in `UI-OLD-2` splits on `', '`. Both files cannot be right about the same tokenizer.

And there is still no length check. `for i in range(len(L))` indexes `s` by `L`'s length and trusts that the model returned as many labels as there were numbers. Three labels and four numbers raises `IndexError` and returns a 500, which is at least loud. Four labels in the wrong order returns a beautifully typeset F-test for a question nobody asked, which is the same silent failure as part one wearing different clothes.

## Where it actually stands

Part one ended with a tally, six of fifteen. Part two cannot end with one, and the reasons why are themselves the honest ending.

The model, as far as it was ever measured, worked. The two inference tests in the notebook are questions with the mixed variance/sum-of-squares structure, and the model classifies both correctly for as long as the twenty-token decode cap lets it speak — the alignment skill, the one genuinely linguistic decision this design still asks for, is demonstrably there. What was never measured is the served path. The server appends a tag the model has seen zero times, its `extractLOS` rejects 57% of the phrasings the training set uses before the model is even called, and its split expects spacing the tokenizer's decode does not produce. Each of those alone is enough to break the chain between a pasted question and a correct plot; production had all three at once. So the honest statement is this: the F-test system demonstrably worked model-in-notebook, demonstrably could not have worked as-deployed, and no measurement exists in between, because I never built the boundary that would have produced one.

There is also a coda that settles what can still be measured, and it is worth admitting because it is the article's own lesson in its final form. At some point after these runs, in some disk-space purge I do not remember making, the multi-gigabyte weight files were cleared out of both projects' checkpoint folders. The configs, the tokenizer files, the trainer state, the training logs — all still there. The weights — part one's `checkpoint-5000`, part two's `checkpoint-2000`, all of them — gone. Neither fine-tuned model can be loaded again. Every model output quoted in this article is quoted from saved notebook outputs, and every count in it was re-run, while writing, against the artifacts that survive: the datasets, the generators, the logs, and the two backends. The artifacts you keep are the system you have.

## What I took from the second one

**Moving the values out of the output space was the right call and it worked.** This is the part I would keep. The reformulation did not make digit errors less likely, it made them impossible, because no digit passes through the decoder. Ask the model only for the thing that requires reading English, which here is "is this number a variance or a sum of squares, and which sample owns it," and let indexing do the rest. When a model keeps getting one part of a task wrong, the question worth asking is not how to train it harder. It is whether that part of the task needs to be in the output at all.

**Check what your output space actually is before you pick a metric.** Ten distinct labels, four of them covering 98% of the data, is classification, and classification has accuracy and a confusion matrix. I used ROUGE, whose floor on this label set is 0.67 and which scores the two most consequential confusions at 0.85. Part one's lesson was that a metric needs to be able to fail. The stronger version is that a metric needs enough range to fail in, and I did not check the range.

**Generation defaults are part of your evaluation, not just your demo.** `predict_with_generate=True` with `max_length` at its default of 20 meant three of my four common labels were cut off in every eval pass of the run. It produced a number that looked like a plateau, held bit-for-bit across three epochs, and reproduces to within a couple of thousandths when you simulate the truncation by hand. The backend, which passes `max_new_tokens=500000`, was never truncated. I had metrics for a model configuration that only existed inside the trainer.

**`list.remove` deletes the first match, and your data has repeats.** Removing the level of significance by value scrambled 100 rows. Removing the "1" and "2" of "Factory 1" and "Factory 2" by value can delete a real sample size. Both are cases of knowing where something is, throwing that away, and searching for it by value instead. Extract by span, not by equality.

**Anything constant across the training set will drift, and it will drift into the server.** I wrote that lesson at the end of part one and then shipped a backend that appends `variance  /` to a model trained on `variance or`, and an `extractLOS` two phrasings behind the one that built the data. Both files were copied from something correct. Neither was imported from anything. A constant is only shared if there is exactly one of it.

**Look at the rare classes.** The six least common outputs in this dataset have thirteen rows each, which is one template's worth, which is the tell. They are not rare phrasings, they are three broken templates: one that labels a sum of squares as a variance, and two that write `{s2sosd}` where they mean `{s1sosd}` and produce questions where both samples report the same number. A class count is a five-second check and it would have caught all three.

Both halves of this project point the same direction. Part one moved the arithmetic out of the model and into scipy. Part two moved the numbers out of the model's output and into a list index. What is left for the model in the F-test version is one genuinely linguistic decision per value, made against a closed vocabulary of six strings, and the reason that decision is still hard is that English is where the ambiguity lives. Everything else was mine to make deterministic, and every time I did, that failure stopped happening.
