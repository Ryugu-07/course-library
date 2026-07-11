# Full Agent Course

Source for the generated multi-page course at `../site/course/`.

## Structure

- `content/`: 30 chapter sources and 8 interactive lab articles.
- `assets/`: shared course CSS and JavaScript, including all lab interactions.
- `projects/`: runnable Mini Codex and Agent Team course projects.
- `course_manifest.py`: seven-stage curriculum and lab routing.
- `build_course.py`: content audit and static-site generator.

## Build

Install the small site-only dependency set, then build:

~~~bash
python3 -m pip install -r course/requirements.txt
python3 course/build_course.py
~~~

The builder refuses missing files, short placeholder chapters, project chapters
without sufficient detail, or articles with fewer than three second-level
sections. Generated output includes 40 HTML pages, shared assets, and downloadable
copies of both project scripts.

## Verify

~~~bash
node --check course/assets/course.js
python3 course/projects/mini_codex.py --self-test
python3 course/projects/agent_team.py --self-test
python3 -m http.server 8778 --directory site
~~~

