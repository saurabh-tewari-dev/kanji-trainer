# Kanji Trainer

Interactive web app for studying Japanese Kanji lessons and doing the exercises from the source PDFs.

## Source files

Copy the lesson PDFs into:

```
materials/pdfs/
```

Leave the filenames as they are. Lesson order in the app comes from the lesson number in the filename, not from alphabetical order.

## App

Open `index.html` in a browser, or from this folder:

```
python3 -m http.server 8765
```

Then visit `http://localhost:8765`.

The app has three sections. Lessons follow the worksheet order. Reviews are the まとめ quizzes. Vocabulary is the TRY! N4 word list from `n4-try.pdf`, kept separate from the kanji lessons. Lesson 1 is the first interactive lesson.

Scans overlap. When the last page of one PDF is also the first page of the next, that page is kept in one place: a review question stays in Reviews, and a lesson opening stays in that lesson. A lesson’s 練習2 is often the left page of the next file, and it is not shown again there.
