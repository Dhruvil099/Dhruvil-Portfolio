My final-year project began with a blunt question: can an arbitrary file make a complete trip through video and come back intact?

The first version proved that it could. I built an ISG (Infinite Storage Glitch) layer that converts archived file data into a video representation and reverses the process later. It could carry different file formats, directories, filenames and metadata through one common pipeline.

That result exposed a second problem. A video made directly from encoded data looks like encoded data. It may be valid video, but it does not resemble the ordinary footage a person would choose to watch or share. Moving the data into a user-provided video while keeping it recoverable was the real research problem.

I eventually recognized its shape: this was an optimization problem disguised as a video-processing problem.

> **Disclosure:** this article includes the research paper's formal, paper-level pseudocode and equations. Production code, tuned values, implementation heuristics, validation rules and the private reconstruction format are intentionally omitted.

## The complete system

The project accepts arbitrary files rather than a hard-coded payload type. Files first cross an archive boundary, which gives the rest of the system one consistent binary input while retaining the structure needed after recovery.

```text
Encode   any file → zip → ISG embed → AdvanceEncoder → public key + private key
Decode   public key + private key → AdvanceDecoder → ISG dislodge → files with metadata preserved
```

The terms public key and private key are project terminology, not a claim that the system implements conventional public-key cryptography. The public component is the video artifact intended for sharing or storage. The private component carries reconstruction information. The recovery path expects both.

![Architecture diagram showing Stage I and Stage II encoding above a matching two-stage decoding path](/projects/secure-data-transmission/architecture.jpg)

*Architecture extracted from the project report. The upper path produces the embedded video and private reconstruction component; the lower path reverses both stages.*

## Why ZIP became a design decision

I came up with the ZIP boundary early in the project. It looked like a small preprocessing choice, but it removed several problems at once. In our tested workflow it produced clear gains without an observed downside, so I made it part of the system contract.

- **One pass can carry many files.** ZIP aggregates mixed file types and directory contents into one byte stream. The encoder does not need separate logic or a separate video pass for every document.
- **Less input means less computation.** Compression can reduce the number of bytes entering the video pipeline. That matters because the system expands file data across frames, and the advanced mapping stage is compute-heavy. Fewer source bytes can mean fewer frames and less processing time.
- **It gave the pipeline a stable recovery boundary.** The decoder only has to reconstruct one archive correctly. Extraction then restores filenames, directory layout and the metadata retained by the archive.
- **It can add a separate confidentiality layer.** A password-protected ZIP can encrypt the payload before the steganographic stages begin. With a strong archive password and a modern ZIP encryption option, the hidden content is not left in plain form inside the byte stream.

The value of the ZIP boundary showed up in testing. A raw `.pptx` failed after small rounding-related losses in the AdvanceEncoder path. The ZIP-wrapped version of that same presentation completed the round trip, opened correctly and retained its metadata. I treat that as an implementation result from this prototype, not a general claim that ZIP is an error-correcting code.

## Building the ISG foundation

I led the project from its beginning. The core direction, including the ISG stage used in our FYP, started with me, and I implemented that stage.

ISG handles the reversible boundary between an archive and a pixelated video. The Rust encoder reads the ZIP as bytes, prepares the data under the selected video settings, generates frames and writes the video stream. The inverse operation reads those frames, converts the pixel representation back into ordered bytes, rebuilds the ZIP and extracts the files.

The Rust implementation covers byte-level I/O, frame construction, multithreaded processing, OpenCV video encoding and decoding, command-line arguments and an interactive terminal interface. It supports three presets as well as custom settings, allowing the user to trade storage density against tolerance for the changes introduced by video processing.

At the ISG phase, my teammates focused on turning that work into a production-ready secure-storage application. Their development stopped at that layer. I continued with the unresolved issue: the data-bearing video still looked artificial.

## A guided pass through the pipeline

The architecture is easier to understand as one continuous trip. Every output becomes the next stage's input, and the decode side deliberately mirrors the encode side.

### Stage 0 · Archive boundary — many user files become one recoverable payload

Files and directories are collected into one ZIP archive. This preserves the package structure, avoids separate encode passes and can reduce the amount of data entering the compute-heavy video stages.

```text
files + directories → payload.zip
```

### Stage 1 · Encode, Algorithm 1 — ISG embed converts archive bytes into frames

The Rust stage reads the ZIP as an ordered byte stream, groups values into colour channels, calculates how much data fits in a frame and emits the intermediate pixelated video. This stage establishes the reversible relationship between bytes and pixels.

```text
payload.zip → byte stream → RGB triplets → pixelated source video
```

### Stage 2 · Encode, Algorithm 2 — AdvanceEncoder solves the carrier-mapping problem

The Python stage analyses the pixelated source and the user-provided carrier. It selects suitable carrier frames, clusters both pixel populations with MiniBatch K-Means and uses the Hungarian algorithm to solve the cluster-assignment problem before producing the merged result.

```text
pixelated source video + carrier video → optimized frame and cluster mapping
```

### Artifact split — one encode pass produces two complementary outputs

The merged video is the shareable public component. A separate private component retains the reconstruction information required by the inverse path. Neither label implies conventional asymmetric cryptography; they describe the roles of the two artifacts in this project.

```text
public component: merged video
private component: reconstruction data
```

### Stage 3 · Decode, Algorithm 3 — AdvanceDecoder reconstructs the pixelated source

The decoder reads the public and private components together. It follows the recorded frame and pixel relationships in reverse, restores each source frame in its original order and writes the reconstructed ISG video.

```text
public component + private component → reconstructed pixelated video
```

### Stage 4 · Decode, Algorithm 4 — ISG dislodge rebuilds the ZIP byte stream

The Rust decoder reads frames sequentially, reverses the RGB representation and writes the reconstructed bytes as a ZIP archive. The archive is then extracted to restore the packaged files, names, structure and retained metadata.

```text
pixelated video → RGB triplets → byte stream → ZIP → recovered files
```

I developed the advanced layer in Python, using OpenCV for frame operations and machine-learning libraries for clustering and assignment. Python made it practical to change the research prototype quickly and inspect intermediate results. Rust and Python had distinct jobs: Rust handled the data-to-video engine; Python handled the experimental visual-mapping layer.

## The four algorithms

The research paper formalizes the round trip as four algorithms. Their main equations are rendered below alongside a connected explanation of what each stage contributes.

Notation: $I$ is the input archive; $V$ is its pixelated video; $S$ and $T$ are source and target videos; $M$ is the merged public video; $D$ is private reconstruction data; and $S'$ is the reconstructed source video.

### Algorithm 01 · Encoding stage I — frame-based data encoding

**Input:** archive $I$, resolution $R=(w,h)$, frame rate $f$, block size $S$.
**Output:** encoded pixelated video $V$.

ISG begins with an ordered byte sequence $B=\{b_1,b_2,\ldots,b_m\}$. It groups that stream into RGB triplets, computes the capacity of a frame and partitions the sequence across exactly as many frames as the payload requires.

$$
C_f = w \times h \times S,
\qquad
F = \left\lceil \frac{m}{C_f} \right\rceil
$$

For each frame $i$, the corresponding subset $D_i$ is transformed into a $w \times h$ colour matrix. The ordered frames are then encoded as an AVI stream. This stage is intentionally deterministic because its decoder must recover the byte ordering exactly.

### Algorithm 02 · Encoding stage II — advanced video steganography encoding

**Input:** source video $S=\{s_0,\ldots,s_{N_S-1}\}$, target video $T=\{t_0,\ldots,t_{N_T-1}\}$, window size $\omega$, number of clusters $n$, reference colour $c_{\mathrm{ideal}}$.
**Output:** merged video $M$, mapping data $D$.

This is the optimization layer. It first assigns a suitability score to target frames. For source frame $i$, an evenly distributed target candidate is projected into the carrier timeline, then a local window is searched for the best unused target frame.

$$
\rho(j)=\lVert c_j-c_{\mathrm{ideal}}\rVert_2,
\qquad
c(i)=\operatorname{round}\!\left(i\frac{N_T-1}{N_S-1}\right)
$$

$$
W_i=\{j\mid \max(0,c(i)-\omega)\le j\le \min(N_T-1,c(i)+\omega)\},
\qquad
j^\star=\arg\min_{\substack{j\in W_i\\j\ \mathrm{unused}}}\rho(j)
$$

Once the frames are paired, MiniBatch K-Means clusters the source and target pixels independently. Distances between the two sets of centroids form a cost matrix. The Hungarian algorithm produces the cluster bijection used by the embedding pass.

$$
C(a,b)=\lVert\mu_S(a)-\mu_T(b)\rVert_2,
\qquad
\phi=\operatorname{HungarianAlgorithm}(C)
$$

The implementation then creates the source-to-target pixel placements, writes source values into a copy of each selected carrier frame and retains the information required for exact reconstruction. The public frames form $M$; the companion reconstruction data forms $D$.

MiniBatch K-Means matters because processing every pixel in a long video as an isolated global assignment would be prohibitively expensive. Clustering reduces the search into groups of visually related pixels. The Hungarian algorithm then solves the one-to-one assignment between those groups. Candidate-frame selection, ordering and reconstruction still have to remain consistent across the full sequence.

### Algorithm 03 · Decoding stage I — advanced video steganography decoding

**Input:** merged video $M$, mapping data $D$.
**Output:** reconstructed source video $S'$.

AdvanceDecoder mirrors the advanced encode stage. For each original source index, it identifies the carrier frame used during encoding, initializes an empty source frame, and moves each recorded value from the merged coordinates back to its original source coordinates.

$$
s_i'(x,y)\leftarrow m_{f(i)}(u,v)
\quad\text{for every recorded mapping}\quad
(x,y)\rightarrow(u,v)
$$

The reconstructed frames are written in source order and with the original source video properties. The output of this algorithm is not yet the user's files; it is the restored pixelated video expected by ISG dislodge.

### Algorithm 04 · Decoding stage II — frame-based archive reconstruction

**Input:** encoded video $V$, output filename, ZIP extension.
**Output:** reconstructed archive $I'$ and extracted files.

ISG dislodge reads the reconstructed video's metadata, calculates the same per-frame capacity used by Algorithm 1 and walks through the frames in order. RGB triplets are flattened into byte values and appended to the reconstructed stream $B'$.

$$
C_f=w\times h\times S,
\qquad
B'=D_1\,\Vert\,D_2\,\Vert\,\cdots\,\Vert\,D_F
$$

The result is written as a ZIP archive, checked at the archive boundary and extracted. At that point the round trip closes: the user receives the original collection of files with its retained names, structure and metadata.

## The research overview

The first page below condenses the project into two visual stages. Stage I creates the pixelated video. Stage II clusters and places that representation into an everyday carrier video, producing a merged video and a separate mapping artifact for reversal.

[![First page of the research overview titled Enhancing Secure Data Transmission using Video-Based Steganography with Pixel-Level Embedding](/projects/secure-data-transmission/research-overview.jpg)](https://drive.google.com/file/d/1drwp_sj262EwzqegxhrTgBsR7Nk36DIQ/view?usp=sharing)

*Page 1 of the research overview. Click the image to open the original two-page PDF on Google Drive.*

## Why the advanced stage was the hard part

A carrier video is not an empty container. Every frame already contains motion, texture, colour, lighting changes, edges and compression artefacts. The public result must remain decodable while staying close enough to the chosen footage to behave like ordinary media.

Treating this as simple pixel substitution was not enough. A locally convenient placement may damage another frame or make reconstruction ambiguous. Once I framed the work as an optimization and assignment problem, I could compare candidate placements instead of accepting the first valid one.

That reframing became the AdvanceEncoderDecoder layer. I designed and implemented the complete solution myself, including the encoding and reconstruction paths. The advanced stage takes the ISG video and a normal video supplied by the user, analyses both, and creates the two artifacts needed for the inverse path.

Lossless intermediate handling was central to the prototype. Resolution, frame count, codec behaviour, archive boundaries and decoder expectations all have to remain consistent across languages and stages. I learned to treat every handoff as a contract: what enters, what leaves, what must be retained and what can change safely.

## What I owned

I originated the FYP direction and led its development. Within the project, I proposed and implemented the ISG foundation, including the decision to package all payloads through ZIP.

When the rest of the team's work remained focused on productionising the ISG-based storage layer, I identified the next research problem and carried it forward independently. My main contribution was recognizing that mapping clustered encoded pixels into a user-provided normal video was an optimization problem. I then designed the AdvanceEncoderDecoder architecture and implemented that layer completely myself.

### Watch the complete pitch demo

The five-minute recording begins with PDF, PowerPoint, Python and Word files and their metadata. It shows ZIP packaging, ISG embedding, the advanced encode pass, playback of the public video, reconstruction, ISG dislodge and the recovered files.

{{component:stego-demo}}

## Security claims, stated carefully

This project is a steganographic transmission and storage prototype. It should not be presented as a substitute for audited encryption.

The split-output design creates a practical access condition because reconstruction requires the public video and its private companion. A password-protected ZIP can add encryption before embedding. Neither point, by itself, proves confidentiality against a defined attacker.

A production system would still need authenticated encryption, integrity checks, safe key and archive handling, tamper detection, strict parsing, independent security review and testing against the exact codecs and platforms used in deployment.

## The result that mattered

The final system was a working chain rather than a disconnected proof of concept. It started with arbitrary files and ended with those files recovered after passing through ZIP, a Rust data-to-video encoder, the advanced clustering and assignment stage, a split public/private output and the inverse pipeline.

The last screen of the demo is the result I cared about most: the original files are back, and their metadata survived the trip.

---

Paper-level equations are rendered in the article. Sensitive code-level details remain intentionally omitted. Architecture and overview images are reproduced from the project report and research overview.
