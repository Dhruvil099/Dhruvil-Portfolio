Our facial expression model scored 100% on its test set. We did not ship it.

That number is the most useful thing in the paper, and not because it is good. A five-class expression classifier that gets every held-out image right has almost certainly been handed the answers somewhere. We put a model that scores 65.28% into the system instead, and the same thing happened on the audio side: the highest-scoring model there did not go in either.

Two bake-offs, two times the winner on paper lost. This is what was behind both decisions, what I now think the 100% actually was, and the measurement I should have built and did not.

## What the system does

EmotiSense was my final-year project at DJ Sanghvi, published in [*Library Progress International*](https://bpasjournals.com/library-science/index.php/journal/article/view/3331) in late 2024. The idea is narrow. Point a camera and a microphone at someone. Run a face model and a voice model over the stream at the same time. Keep a timeline of what each one thinks the person is feeling, and if that timeline shifts sharply, raise an alert to a caregiver and save the session for later review.

The intended users were people supporting children with disabilities, where a sudden change in state matters and the child may not be able to describe it. That framing is also the source of the hardest problem in the project, which I come back to at the end.

Two models, two modalities, no shared backbone:

- **Voice.** Audio is cut into 15-second segments. From each segment the system extracts chroma, MFCC, mel-frequency, spectral contrast, spectral centroid, zero crossing rate, pitch and intensity, stacks them into a single vector, and classifies into one of seven labels: angry, disgust, fear, happy, neutral, sad, surprised.
- **Face.** Frames are pulled from the video, a Haar cascade finds the face, the crop is resized to 48×48 and divided by 255, and a CNN classifies it into five labels. The feature maps run 46×46×32, 23×23×32, 21×21×64, 10×10×64, 8×8×128, 4×4×128, then flatten to 2048, through a 512-unit dense layer, out to the classes.

Each prediction is timestamped, so a session produces two parallel emotion timelines plus the pitch and intensity traces the audio model is reading.

{{component:emotisense-demo}}

The training data is four public sets: CREMA-D (7,442 clips from 91 actors, 48 male and 43 female, aged 20 to 74), RAVDESS (1,440 files, 24 professional actors, evenly split by gender), the Surrey audio-visual set (480 files, 120 utterances from 4 speakers), and Oulu-CASIA for the face model (six expressions from 80 people aged 23 to 58, 73.8% of them male), which the University of Oulu provided on request.

## The audio bake-off

Three architectures, same task:

| Audio model | Trainable parameters | Test accuracy |
|---|---:|---:|
| CNN + RNN | 114,247 | 60.40% |
| CNN | 1.54 million | **87.62%** |
| LSTM | 77,127 | 73.6% |

The CNN wins by fourteen points and we did not use it. The LSTM went into the system, on the grounds that it held up better when predictions were being made live rather than over a shuffled test set.

I still think that call was right, and the shape of it is worth sitting with. The CNN is twenty times the size of the LSTM and scores fourteen points higher offline. Whatever it learned to do well on the test set did not survive contact with a webcam and a room. The model we kept is the small one.

## The visual bake-off, and the number that stopped us

| Visual model | Test accuracy |
|---|---:|
| CNN | **100%** |
| Improved CNN | 65.28% |

We read the 100% as a fault rather than a result, and swapped in the 65.28% model. The paper says as much in one line: the perfect score "suggests a strong likelihood of overfitting."

That was the right instinct, stated too gently. Here is the mechanism I would name now. Oulu-CASIA is 80 people performing six expressions on camera. Every clip yields many frames, and consecutive frames of one person holding one expression are near-duplicates of each other: same face, same room, same lighting, same glasses, same collar. Split those frames at random and near-copies of the same moment land on both sides of the split. A model can then score perfectly by learning which of the 80 faces it is looking at and what that person's session looked like, without learning anything about expression that would transfer to a child it has never seen.

The fix is not a smaller network or more dropout. It is a subject-disjoint split: every frame from a given person goes entirely into train or entirely into test, so the test set asks the question the deployment asks. We did not do that, and I cannot retroactively claim the 65.28% model was evaluated that way either.

There is a second problem visible in the paper's own figures. The two visual confusion matrices do not share a label set. The 100% model's axes read anger, disgust, happiness, sadness, surprise. The shipped model's read surprise, neutral, anger, happy, sad. Their support totals differ too. So the headline comparison in that table, 100% against 65.28%, is not two models measured against the same yardstick. It is two models measured against two different ones. That is my error to own: it went into a published table looking like a comparison.

## What the shipped model actually does

The 65.28% figure hides an asymmetry that matters more than the average. In the classification report, the shipped visual model recalls surprise at 0.90 while its precision on surprise is 0.50, and neutral runs the opposite way, 0.83 precision against 0.42 recall.

Read that as behaviour rather than as numbers. The model is quick to call something surprise and half of those calls are wrong. It is reluctant to call something neutral and misses well over half the neutral cases it sees. In a system whose entire purpose is to notice a sudden change and page a caregiver, those two errors are the ones that decide whether the product is useful or exhausting. A classifier that over-fires on surprise and under-recognises neutral will generate alerts on a calm child. Average accuracy does not show you that. It took the per-class table to see it, and a single accuracy number is what most of the project was steered by.

## The measurement I never built

Both model choices came down to the same sentence: it performed better in real time. Both times I believe that observation was true. Neither time was it measured.

There was no live protocol, no labelled recordings of the actual deployment condition, no agreement between two people watching the same session and marking what the child was doing. The criterion that decided the system was judged by looking at it. That is the same failure I hit in a later project, where an evaluation metric could not see the bug it was supposed to catch, and it is the one I would fix first here:

1. **Split by subject, not by frame.** Any accuracy from a random frame-level split on this data should be assumed inflated until shown otherwise.
2. **Write down the live criterion before choosing.** If a model is going to be picked for real-time behaviour, real-time behaviour needs a recorded, labelled test set with a stated pass mark, not an impression formed while demoing.
3. **Report per class.** Accuracy on five imbalanced emotion classes hid an alerting-relevant failure in plain sight.
4. **Compare on one test set.** Obvious, and I still published a table that did not.

## What this system should not be used for

The gap I would flag hardest to anyone building on this is between what the models were trained on and who they were aimed at.

Every dataset here is performed emotion. CREMA-D, RAVDESS and Surrey are actors delivering lines in a target emotion. Oulu-CASIA subjects were asked to sit in front of a camera and produce six expressions on cue. The intended deployment is spontaneous behaviour from children with disabilities, some of whom communicate differently precisely because of their condition. Nothing in the paper measures accuracy on that population, because no data from that population was used. An acted "sad" from a 30-year-old actor and genuine distress in a non-verbal child are not the same signal, and there is no evidence in this work that a model trained on the first recognises the second.

That matters more than usual because of what the output does. This is not a label sitting in a log. It escalates to a caregiver about a person who may not be able to contest it. A false alert costs attention and trust. A missed one is worse, and a system that appears to be watching may reduce the human attention that would otherwise be there. Emotion inference from face and voice is contested as a science even in ideal conditions, and I would not want this deployed as a source of truth about how someone feels. As a prompt to go and look at a child in person, with a human deciding what is actually happening, it is defensible. As anything more automatic, it is not, and the accuracies in the paper do not license it.

That is a limitation of the project, not a footnote to it, and it is the piece I would put first if I were writing the paper again.

## What I would keep

The two-model split was the right structure. Face and voice fail in different situations, and keeping them separate with their own timelines means a caregiver reviewing a session can see when they disagree, which is more informative than a fused score that hides the disagreement.

Rejecting the 100% was right, and it is the habit I have kept. A held-out score that lands on a perfect round number is a claim about your data pipeline before it is a claim about your model. In this project the evidence was strong enough to override a very attractive number, and the same instinct is what makes me distrust smooth results now.

What I would not keep is choosing between models on an impression. The judgement was sound both times. It just was not evidence, and I had no way to tell the difference at the time.

---

Published as: Dhruvil Shah, Isha Shah, Smriti Raman, Sahil Shah, Komal Patil, Aruna Gawade, Nilesh Rathod, Angelin Florence, [EmotiSense: Enhancing Information Accessibility and User Experience through Multimodal Emotion Recognition for Individuals with Disabilities](https://bpasjournals.com/library-science/index.php/journal/article/view/3331), *Library Progress International* 44(3), 2024, pp. 26333–26352. All accuracies, architectures and dataset counts above are from that paper; the reading of the 100% result, the label-set mismatch and the deployment-population argument are mine, written afterwards.
