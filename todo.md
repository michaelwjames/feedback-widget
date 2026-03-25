1. [DONE] user uses feedback widget on a page, frontend data is sent to backend server
2. [DONE] widget server saves the feedback in a folder - one md file + one image
3. [DONE] server sends the feedback to the groq-vision-ocr service (refactored for image + md file analysis)
4. [DONE] vision-enabled LLM in Groq cross references text & screenshot image to create prompt for addressing feedback
5. [DONE] server receives back json with a prompt for Jules
6. [DONE] server uses jules-subagent to send a prompt to Jules to address the feedback


