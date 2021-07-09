# Deploy Page

---

### What can be done here?

- [Review Running Counting Processes](#review-running-counting-processes)
- [Start New Counting Process](#start-new-counting-process)
  - [Single Stream](#single-stream)
  - [Multi Stream](#multi-stream)
- [Capture a Video](#capture-a-video)

---

## Review Running Counting Processes <a name=review-running-counting-processes></a>

All running and completed deploys and their status icons can be seen in the left panel. Select a deploy to see a more details.

### Status icons:

- <img src="../markdowns/images/5_Deploy/fast_forward_icon.png" width="20"/>: Process is still **running**.

- <img src="../markdowns/images/5_Deploy/checkmarks_icon.png" width="20"/>: Successfully **completed**.

- <img src="../markdowns/images/5_Deploy/exclamation_mark_icon.png" width="20"/>: Unsuccessfully **completed** (aka failed).

## Start New Counting Process <a name=start-new-counting-process></a>

### Single Stream <a name=single-stream></a>

- **Note:** with the single stream approach, you can get person-counts very frequently (multiple times per minute).
- Click on the **[blue +STREAM button]**.
- Fill in window that pops up.
  - Use a **Name** that makes you recognize the camera.
  - Pick the **stream url** of the camera you want to do person counts with.
  - Choose a **Callback URL** that points to the server that should receive the person count results.
  - Use a **scale factor** that is consistent with the trained model (usually something like 0.5).
  - **Output scale factor** can be left empty
  - **FPS output stream** can be set to 1.
  - In the **Neural Network** dropdown:
    - Pick **train_csrnet.py** for **person counting (ROI)**.
    - Pick **train_loi_density.py** for **line of interest (LOI)** counting.
  - For **Pretrained model**, pick a model that was previously trained for this camera, for the given task (**ROI** or **LOI**).
  - The **Save Images** checkbox should be **OFF**.
  - The **Use Cuda** checkbox should be **ON**.
  - The **Use Social Distancing** checkbox should be **OFF**.
- When done, click the **SUBMIT** button on the pop-up window.
- Your stream should start running now. Counts should get pushed to your callback URL for further usage.

### Multi Stream <a name=multi-stream></a>

- **Note:** with the multi stream approach, you can process a lot of camera's at the same time (up to about 60) on a single GPU. For each camera, you will only get one person-count processed per minute though. The multi stream mode does not support **line of interest** counting.
- Click on the **[blue +MULTI button]** to open a pop-up window.
- Fill in a unique name for this **multi stream** in the **multicapture streamname** field.
- You can now add multiple streams to this multi-stream, using two methods:
  - 1. Using the the **prefill from stream-instance** dropdown.
  - 2. Clicking the [ADD STREAM button], and selecting the newly created stream (.e.g **stream: 0**). You can add information in the same way as for the [single stream](#single-stream).
  - Streams can be removed using the **[grey round minus button]**.
  - You can add multiple streams (up to about 60) before clicking **SUBMIT**.
- After submitting, the multistream should start running. Counts should get pushed to your callback URL(s) for further usage.

**Example Video:**

<video width="800" height="450" controls>
  <source src="../markdowns/videos/Task 4_2 - Deploy a Prediction Model.mp4" type="video/mp4">
</video>



## Capture a Video <a name=capture-a-video></a>

- Make sure the camera you want to capture a video with with is present in the system. Go to [Camera Page](../camera) to check if the camera is already present, or to add it.
- Click on the **[blue +CAPTURE button]**.
- Pick the **stream url** of the camera that you want to capture video material from.
- Choose a **name** that you want the resulting video to have.
- Choose a **scale factor** (we suggest a default value of 1, which keeps the video resolution the same, 0.5 halves the resolution).
- The **input fps** and **output fps** can be left empty.

---

