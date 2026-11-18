(function () {
  const main = document.querySelector("#app");
  const navLinks = document.querySelectorAll("[data-nav]");
  const SCORE_KEY = "kanji-trainer-scores";

  const ACTIVITIES = [
    { id: "study", label: "Study the kanji", book: "Kanji" },
    { id: "practice1", label: "Choose the reading", book: "練習1" },
    { id: "practice2", label: "Choose the kanji", book: "練習2" },
  ];

  function scores() {
    try {
      return JSON.parse(localStorage.getItem(SCORE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function saveScore(key, correct, total) {
    const all = scores();
    const previous = all[key];
    if (!previous || correct / total >= previous.correct / previous.total) {
      all[key] = { correct, total };
      localStorage.setItem(SCORE_KEY, JSON.stringify(all));
    }
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value);
    });
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.append(child);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const hold = copy[i];
      copy[i] = copy[j];
      copy[j] = hold;
    }
    return copy;
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find(function (item) {
      return item.lang === "ja-JP" || item.lang.indexOf("ja") === 0;
    });
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function statusLabel(status) {
    if (status === "ready") return "Ready";
    if (status === "missing") return "No file yet";
    return "Not added yet";
  }

  function setNav(section) {
    navLinks.forEach(function (link) {
      const on = link.dataset.nav === section;
      link.classList.toggle("is-active", on);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderLessons() {
    setNav("lessons");
    document.title = "Lessons · Kanji Trainer";
    const list = el("ol", { class: "index" });
    DATA.lessons.forEach(function (lesson) {
      const body = [
        el("span", { class: "index-num", text: String(lesson.number) }),
        el("span", { class: "index-main" }, [
          el("span", { class: "index-title jp", text: lesson.title }),
          el("span", { class: "index-sub", text: lesson.reading + " · " + lesson.meaning }),
        ]),
        el("span", { class: "pill pill-" + lesson.status, text: statusLabel(lesson.status) }),
      ];
      if (lesson.status === "ready") {
        list.append(el("li", {}, [el("a", { class: "index-row", href: "#/lesson/" + lesson.number }, body)]));
      } else {
        list.append(el("li", {}, [el("div", { class: "index-row is-locked" }, body)]));
      }
    });
    clear(main);
    main.append(
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "Kanji" }),
        el("h1", { text: "Lessons" }),
        el("p", { class: "lede", text: "Ordered by the lesson number in the file name. Each lesson has the kanji cards, then both practices." }),
      ]),
      list
    );
  }

  function renderReviews() {
    setNav("reviews");
    document.title = "Reviews · Kanji Trainer";
    const saved = scores();
    const list = el("ol", { class: "index" });
    DATA.reviews.forEach(function (review) {
      const score = saved["review:" + review.id];
      const body = [
        el("span", { class: "index-main" }, [
          el("span", { class: "index-title", text: review.title }),
          el("span", { class: "index-sub", text: score ? "Best " + score.correct + "/" + score.total : "Reading, then kanji." }),
        ]),
        el("span", { class: "pill pill-" + review.status, text: statusLabel(review.status) }),
      ];
      if (review.status === "ready") {
        list.append(el("li", {}, [el("a", { class: "index-row", href: "#/review/" + review.id }, body)]));
      } else {
        list.append(el("li", {}, [el("div", { class: "index-row is-locked" }, body)]));
      }
    });
    clear(main);
    main.append(
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "Kanji" }),
        el("h1", { text: "Reviews" }),
        el("p", { class: "lede", text: "The まとめ quizzes stay out of the lesson list. Each one asks for the reading, then the kanji. Answers stay hidden until the end." }),
      ]),
      list,
      el("p", { class: "footnote", text: "There is no review sheet for lessons 16–18 in the folder." })
    );
  }

  function vocabChapter(number) {
    const words = DATA.vocabulary && DATA.vocabulary[number];
    return words && words.length ? words : null;
  }

  function allVocab() {
    const all = [];
    DATA.vocabularyChapters.forEach(function (chapter) {
      const words = vocabChapter(chapter);
      if (words) all.push.apply(all, words);
    });
    return all;
  }

  function meaningCounts() {
    const counts = {};
    allVocab().forEach(function (item) {
      counts[item.meaning] = (counts[item.meaning] || 0) + 1;
    });
    return counts;
  }

  function fillChoices(answer, groups) {
    const chosen = [answer];
    const seen = {};
    seen[answer] = true;
    groups.forEach(function (group) {
      shuffle(group).forEach(function (value) {
        if (chosen.length >= 4 || !value || seen[value]) return;
        seen[value] = true;
        chosen.push(value);
      });
    });
    return shuffle(chosen);
  }

  function renderVocabulary() {
    setNav("vocabulary");
    document.title = "Vocabulary · Kanji Trainer";
    const list = el("ol", { class: "index" });
    DATA.vocabularyChapters.forEach(function (chapter) {
      const words = vocabChapter(chapter);
      const body = [
        el("span", { class: "index-num", text: String(chapter) }),
        el("span", { class: "index-main" }, [
          el("span", { class: "index-title", text: "Chapter " + chapter }),
          el("span", { class: "index-sub", text: words ? words.length + " words" : "Word, reading, and English meaning." }),
        ]),
        el("span", { class: "pill pill-" + (words ? "ready" : "soon"), text: words ? "Ready" : "Not added yet" }),
      ];
      if (words) {
        list.append(el("li", {}, [el("a", { class: "index-row", href: "#/vocabulary/" + chapter }, body)]));
      } else {
        list.append(el("li", {}, [el("div", { class: "index-row is-locked" }, body)]));
      }
    });
    clear(main);
    main.append(
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "TRY! N4" }),
        el("h1", { text: "Vocabulary" }),
        el("p", { class: "lede", text: "A separate section from the kanji lessons. Chapters follow the word list in n4-try, not the kanji lesson numbers." }),
      ]),
      list
    );
  }

  function renderVocabChapter(number) {
    const words = vocabChapter(number);
    if (!words) {
      renderMissing();
      return;
    }
    setNav("vocabulary");
    document.title = "Chapter " + number + " · Kanji Trainer";
    const saved = scores();
    const activities = [
      { id: "study", label: "Study the words", book: "Word list" },
      { id: "meaning", label: "Choose the meaning", book: "English" },
      { id: "word", label: "Choose the word", book: "Japanese" },
    ];
    const list = el("ol", { class: "activities" });
    activities.forEach(function (activity, index) {
      const key = "vocab:" + number + ":" + activity.id;
      const score = saved[key];
      list.append(
        el("li", {}, [
          el("a", { class: "activity", href: "#/vocabulary/" + number + "/" + activity.id }, [
            el("span", { class: "activity-num", text: String(index + 1) }),
            el("span", { class: "activity-copy" }, [
              el("span", { class: "activity-label", text: activity.label }),
              el("span", { class: "activity-book", text: activity.book }),
            ]),
            score ? el("span", { class: "activity-meta", text: score.correct + "/" + score.total }) : null,
          ]),
        ])
      );
    });
    clear(main);
    main.append(
      el("a", { class: "back", href: "#/vocabulary", text: "All chapters" }),
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "TRY! N4" }),
        el("h1", { text: "Chapter " + number }),
        el("p", { class: "lede", text: words.length + " words. Readings can be played. Quizzes keep the answers hidden until the end." }),
      ]),
      list
    );
  }

  function renderVocabStudy(number) {
    const words = vocabChapter(number);
    if (!words) {
      renderMissing();
      return;
    }
    setNav("vocabulary");
    document.title = "Chapter " + number + " words · Kanji Trainer";
    const list = el("ul", { class: "vocab-list" });
    words.forEach(function (item) {
      list.append(
        el("li", {}, [
          el("span", { class: "jp word-jp", text: item.word }),
          el("span", { class: "jp vocab-read", text: item.reading }),
          el("span", { class: "vocab-meaning", text: item.meaning }),
          el("button", {
            type: "button",
            class: "play",
            text: "Play",
            onclick: function () {
              speak(item.reading || item.word);
            },
          }),
        ])
      );
    });
    clear(main);
    main.append(
      el("a", { class: "back", href: "#/vocabulary/" + number, text: "Chapter " + number }),
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "Chapter " + number }),
        el("h1", { text: "Study the words" }),
      ]),
      list
    );
  }

  function renderVocabQuiz(number, mode) {
    const words = vocabChapter(number);
    if (!words || (mode !== "meaning" && mode !== "word")) {
      renderMissing();
      return;
    }
    const counts = meaningCounts();
    const bank = mode === "word"
      ? words.filter(function (item) { return counts[item.meaning] === 1; })
      : words.slice();
    if (!bank.length) {
      renderMissing();
      return;
    }
    setNav("vocabulary");
    const all = allVocab();
    const questions = bank.map(function (item) {
      const answer = mode === "word" ? item.word : item.meaning;
      const same = words.map(function (other) {
        return mode === "word" ? other.word : other.meaning;
      });
      const rest = all.map(function (other) {
        return mode === "word" ? other.word : other.meaning;
      });
      return { source: item, choices: fillChoices(answer, [same, rest]) };
    });
    let index = 0;
    const picked = [];
    const title = mode === "word" ? "Choose the word" : "Choose the meaning";

    function drawQuestion() {
      const question = questions[index];
      const source = question.source;
      const ask = mode === "word" ? source.meaning : source.word;
      const options = el("div", { class: "choices", role: "group", "aria-label": "Answers" });
      let selected = picked[index] || null;
      question.choices.forEach(function (choice) {
        options.append(
          el("button", {
            type: "button",
            class: "choice choice-text" + (mode === "word" ? " jp" : "") + (choice === selected ? " is-selected" : ""),
            text: choice,
            onclick: function () {
              selected = choice;
              picked[index] = choice;
              options.querySelectorAll("button").forEach(function (option) {
                option.classList.toggle("is-selected", option.textContent === selected);
              });
              next.disabled = false;
            },
          })
        );
      });
      const next = el("button", {
        type: "button",
        class: "primary",
        disabled: !selected,
        text: index === questions.length - 1 ? "See result" : "Next",
        onclick: function () {
          if (!picked[index]) return;
          if (index === questions.length - 1) {
            drawResult();
            return;
          }
          index += 1;
          drawQuestion();
        },
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/vocabulary/" + number, text: "Chapter " + number }),
        el("p", { class: "progress", text: title + "  ·  " + (index + 1) + " / " + questions.length }),
        el("div", { class: "prompt" }, [
          el("p", { class: "prompt-ask" + (mode === "meaning" ? " jp" : ""), text: ask }),
        ]),
        options,
        el("div", { class: "pager" }, [next])
      );
      document.title = title + " · Kanji Trainer";
    }

    function drawResult() {
      const correct = picked.filter(function (choice, i) {
        const source = questions[i].source;
        const answer = mode === "word" ? source.word : source.meaning;
        return choice === answer;
      }).length;
      saveScore("vocab:" + number + ":" + mode, correct, questions.length);
      const reviewList = el("ol", { class: "result-list" });
      questions.forEach(function (question, i) {
        const source = question.source;
        const answer = mode === "word" ? source.word : source.meaning;
        const mine = picked[i];
        const options = el("ul", { class: "result-options" });
        question.choices.forEach(function (choice) {
          const isCorrect = choice === answer;
          const isMine = choice === mine;
          let note = "";
          let cls = "result-option";
          if (isCorrect) {
            cls += " is-correct";
            note = "Correct";
          } else if (isMine) {
            cls += " is-wrong";
            note = "Your answer";
          }
          options.append(
            el("li", { class: cls }, [
              el("span", { class: mode === "word" ? "jp" : "", text: choice }),
              note ? el("span", { class: "result-note", text: note }) : null,
            ])
          );
        });
        reviewList.append(
          el("li", { class: "result-item" }, [
            el("p", { class: "result-q" + (mode === "meaning" ? " jp" : ""), text: mode === "word" ? source.meaning : source.word }),
            el("p", { class: "result-sub jp", text: source.reading }),
            options,
          ])
        );
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/vocabulary/" + number, text: "Chapter " + number }),
        el("header", { class: "page-head" }, [
          el("p", { class: "eyebrow", text: "Chapter " + number }),
          el("h1", { text: correct + " / " + questions.length }),
          el("p", { class: "lede", text: "Correct choices are marked. A wrong pick is marked as your answer." }),
        ]),
        reviewList,
        el("div", { class: "pager" }, [
          el("button", {
            type: "button",
            text: "Try again",
            onclick: function () {
              renderVocabQuiz(number, mode);
            },
          }),
          el("a", { class: "button primary", href: "#/vocabulary/" + number, text: "Back to chapter" }),
        ])
      );
    }

    drawQuestion();
  }

  function lessonByNumber(number) {
    return DATA.lessons.find(function (lesson) {
      return lesson.number === number;
    });
  }

  function renderLesson(number) {
    const lesson = lessonByNumber(number);
    const content = DATA.lessonContent[number];
    if (!lesson || !content) {
      renderMissing();
      return;
    }
    setNav("lessons");
    document.title = "Lesson " + number + " · Kanji Trainer";
    const saved = scores();
    const activities = el("ol", { class: "activities" });
    let shown = 0;
    ACTIVITIES.forEach(function (activity) {
      if (activity.id === "practice2" && !(content.practice2 && content.practice2.length)) return;
      shown += 1;
      const key = number + ":" + activity.id;
      const score = saved[key];
      activities.append(
        el("li", {}, [
          el("a", { class: "activity", href: "#/lesson/" + number + "/" + activity.id }, [
            el("span", { class: "activity-num", text: String(shown) }),
            el("span", { class: "activity-copy" }, [
              el("span", { class: "activity-label", text: activity.label }),
              el("span", { class: "activity-book", text: activity.book }),
            ]),
            score ? el("span", { class: "activity-meta", text: score.correct + "/" + score.total }) : null,
          ]),
        ])
      );
    });
    const strip = el("ol", { class: "kanji-strip" });
    content.kanji.forEach(function (card) {
      strip.append(el("li", { class: "jp", text: card.character }));
    });
    clear(main);
    main.append(
      el("a", { class: "back", href: "#/lessons", text: "All lessons" }),
      el("header", { class: "page-head" }, [
        el("p", { class: "eyebrow", text: "Lesson " + number }),
        el("p", { class: "reading", text: lesson.reading }),
        el("h1", { class: "jp", text: lesson.title }),
        el("p", { class: "lede", text: lesson.meaning }),
      ]),
      strip,
      el("p", { class: "note", text: content.note }),
      activities
    );
  }

  function renderStudy(number) {
    const lesson = lessonByNumber(number);
    const content = DATA.lessonContent[number];
    if (!content) {
      renderMissing();
      return;
    }
    setNav("lessons");
    let index = 0;

    function draw() {
      const card = content.kanji[index];
      const readings = el("dl", { class: "readings" });
      if (card.kun.length) {
        readings.append(el("dt", { text: "Kun" }), el("dd", { class: "jp", text: card.kun.join("、") }));
      }
      if (card.on.length) {
        readings.append(el("dt", { text: "On" }), el("dd", { class: "jp", text: card.on.join("、") }));
      }
      const words = el("ul", { class: "words" });
      card.words.forEach(function (word) {
        words.append(
          el("li", {}, [
            el("span", { class: "word-jp jp", text: word.word }),
            el("span", { class: "word-read", text: word.reading }),
            el("span", { class: "word-mean", text: word.meaning }),
            el("button", {
              type: "button",
              class: "play",
              text: "Play",
              "aria-label": "Play " + word.word,
              onclick: function () {
                speak(word.reading);
              },
            }),
          ])
        );
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/lesson/" + number, text: "Lesson " + number }),
        el("p", { class: "progress", text: index + 1 + " / " + content.kanji.length + "  ·  #" + card.entry }),
        el("article", { class: "study-card" }, [
          el("p", { class: "study-char jp", text: card.character }),
          el("p", { class: "study-mean", text: card.meaning }),
          readings,
          el("p", { class: "strokes", text: card.strokes + " strokes" }),
          el("p", { class: "mnemonic", text: card.mnemonic }),
          words,
        ]),
        el("div", { class: "pager" }, [
          el("button", {
            type: "button",
            text: "Previous",
            disabled: index === 0,
            onclick: function () {
              stopSpeech();
              index -= 1;
              draw();
            },
          }),
          el("button", {
            type: "button",
            class: "primary",
            text: index === content.kanji.length - 1 ? "Back to lesson" : "Next",
            onclick: function () {
              stopSpeech();
              if (index === content.kanji.length - 1) {
                location.hash = "#/lesson/" + number;
                return;
              }
              index += 1;
              draw();
            },
          }),
        ])
      );
      document.title = card.character + " · Lesson " + lesson.number;
    }

    draw();
  }

  function renderQuiz(number, activityId) {
    const content = DATA.lessonContent[number];
    const lesson = lessonByNumber(number);
    if (!content || !lesson) {
      renderMissing();
      return;
    }
    setNav("lessons");
    const bank = activityId === "practice1" ? content.practice1 : content.practice2;
    const activity = ACTIVITIES.find(function (item) {
      return item.id === activityId;
    });
    const questions = bank.map(function (question) {
      return {
        source: question,
        choices: shuffle(question.choices),
      };
    });
    let index = 0;
    const picked = [];

    function drawQuestion() {
      const question = questions[index];
      const source = question.source;
      const prompt = el("div", { class: "prompt" });
      if (activityId === "practice2") {
        prompt.append(
          el("p", { class: "prompt-reading", text: source.reading }),
          el("p", { class: "prompt-meaning", text: source.meaning }),
          el("p", { class: "prompt-sentence jp" }, [
            el("span", { text: source.before }),
            el("span", { class: "blank", text: "□" }),
            el("span", { text: source.after }),
          ])
        );
      } else {
        prompt.append(el("p", { class: "prompt-ask jp", text: source.ask }), source.hint ? el("p", { class: "prompt-meaning", text: source.hint }) : null);
      }

      const options = el("div", { class: "choices", role: "group", "aria-label": "Answers" });
      let selected = picked[index] || null;
      question.choices.forEach(function (choice) {
        options.append(
          el("button", {
            type: "button",
            class: "choice" + (activityId === "practice1" ? " choice-text" : " choice-kanji") + (choice === selected ? " is-selected" : ""),
            text: choice,
            onclick: function () {
              selected = choice;
              picked[index] = choice;
              options.querySelectorAll("button").forEach(function (option) {
                option.classList.toggle("is-selected", option.textContent === selected);
              });
              next.disabled = false;
            },
          })
        );
      });

      const next = el("button", {
        type: "button",
        class: "primary",
        disabled: !selected,
        text: index === questions.length - 1 ? "See result" : "Next",
        onclick: function () {
          if (!picked[index]) return;
          if (index === questions.length - 1) {
            drawResult();
            return;
          }
          index += 1;
          drawQuestion();
        },
      });

      clear(main);
      main.append(
        el("a", { class: "back", href: "#/lesson/" + number, text: "Lesson " + number }),
        el("p", { class: "progress", text: activity.book + "  ·  " + (index + 1) + " / " + questions.length }),
        prompt,
        options,
        el("div", { class: "pager" }, [next])
      );
      document.title = activity.label + " · Lesson " + number;
    }

    function drawResult() {
      const correct = picked.filter(function (choice, i) {
        return choice === questions[i].source.answer;
      }).length;
      saveScore(number + ":" + activityId, correct, questions.length);
      const review = el("ol", { class: "result-list" });
      questions.forEach(function (question, i) {
        const source = question.source;
        const mine = picked[i];
        const options = el("ul", { class: "result-options" });
        question.choices.forEach(function (choice) {
          const isCorrect = choice === source.answer;
          const isMine = choice === mine;
          let note = "";
          let cls = "result-option";
          if (isCorrect) {
            cls += " is-correct";
            note = "Correct";
          } else if (isMine) {
            cls += " is-wrong";
            note = "Your answer";
          }
          options.append(
            el("li", { class: cls }, [
              el("span", { class: activityId === "practice2" ? "jp" : "", text: choice }),
              note ? el("span", { class: "result-note", text: note }) : null,
            ])
          );
        });
        const hasContext = activityId === "practice2" && (source.before || source.after);
        const heading = activityId === "practice1" ? source.ask : hasContext ? (source.before || "") + "□" + (source.after || "") : source.reading;
        const sub = activityId === "practice1" ? source.hint : hasContext ? source.reading + " · " + source.meaning : source.meaning;
        review.append(
          el("li", { class: "result-item" }, [
            el("p", { class: "result-q jp", text: heading }),
            sub ? el("p", { class: "result-sub", text: sub }) : null,
            options,
          ])
        );
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/lesson/" + number, text: "Lesson " + number }),
        el("header", { class: "page-head" }, [
          el("p", { class: "eyebrow", text: activity.book }),
          el("h1", { text: correct + " / " + questions.length }),
          el("p", { class: "lede", text: "Correct choices are marked. A wrong pick is marked as your answer." }),
        ]),
        review,
        el("div", { class: "pager" }, [
          el("button", {
            type: "button",
            text: "Try again",
            onclick: function () {
              renderQuiz(number, activityId);
            },
          }),
          el("a", { class: "button primary", href: "#/lesson/" + number, text: "Back to lesson" }),
        ])
      );
    }

    drawQuestion();
  }

  function renderReviewQuiz(id) {
    const review = DATA.reviews.find(function (item) {
      return item.id === id;
    });
    const bankSource = DATA.reviewContent && DATA.reviewContent[id];
    if (!review || !bankSource) {
      renderMissing();
      return;
    }
    setNav("reviews");
    const questions = bankSource.map(function (question) {
      return { source: question, choices: shuffle(question.choices) };
    });
    let index = 0;
    const picked = [];

    function drawQuestion() {
      const question = questions[index];
      const source = question.source;
      const hint = source.kind === "kanji" ? "Kanji for " + source.hint : "Reading of " + source.hint;
      const options = el("div", { class: "choices", role: "group", "aria-label": "Answers" });
      let selected = picked[index] || null;
      question.choices.forEach(function (choice) {
        options.append(
          el("button", {
            type: "button",
            class: "choice choice-text" + (source.kind === "kanji" ? " jp" : "") + (choice === selected ? " is-selected" : ""),
            text: choice,
            onclick: function () {
              selected = choice;
              picked[index] = choice;
              options.querySelectorAll("button").forEach(function (option) {
                option.classList.toggle("is-selected", option.textContent === selected);
              });
              next.disabled = false;
            },
          })
        );
      });
      const next = el("button", {
        type: "button",
        class: "primary",
        disabled: !selected,
        text: index === questions.length - 1 ? "See result" : "Next",
        onclick: function () {
          if (!picked[index]) return;
          if (index === questions.length - 1) {
            drawResult();
            return;
          }
          index += 1;
          drawQuestion();
        },
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/reviews", text: "Reviews" }),
        el("p", { class: "progress", text: source.part + "  ·  " + (index + 1) + " / " + questions.length }),
        el("div", { class: "prompt" }, [
          el("p", { class: "prompt-ask jp", text: source.ask }),
          el("p", { class: "prompt-meaning", text: hint }),
        ]),
        options,
        el("div", { class: "pager" }, [next])
      );
      document.title = review.title + " · Kanji Trainer";
    }

    function drawResult() {
      const correct = picked.filter(function (choice, i) {
        return choice === questions[i].source.answer;
      }).length;
      saveScore("review:" + id, correct, questions.length);
      const reviewList = el("ol", { class: "result-list" });
      questions.forEach(function (question, i) {
        const source = question.source;
        const mine = picked[i];
        const options = el("ul", { class: "result-options" });
        question.choices.forEach(function (choice) {
          const isCorrect = choice === source.answer;
          const isMine = choice === mine;
          let note = "";
          let cls = "result-option";
          if (isCorrect) {
            cls += " is-correct";
            note = "Correct";
          } else if (isMine) {
            cls += " is-wrong";
            note = "Your answer";
          }
          options.append(
            el("li", { class: cls }, [
              el("span", { class: source.kind === "kanji" ? "jp" : "", text: choice }),
              note ? el("span", { class: "result-note", text: note }) : null,
            ])
          );
        });
        const hint = source.kind === "kanji" ? "Kanji for " + source.hint : "Reading of " + source.hint;
        reviewList.append(
          el("li", { class: "result-item" }, [
            el("p", { class: "result-q jp", text: source.ask }),
            el("p", { class: "result-sub", text: hint }),
            options,
          ])
        );
      });
      clear(main);
      main.append(
        el("a", { class: "back", href: "#/reviews", text: "Reviews" }),
        el("header", { class: "page-head" }, [
          el("p", { class: "eyebrow", text: review.title }),
          el("h1", { text: correct + " / " + questions.length }),
          el("p", { class: "lede", text: "Correct choices are marked. A wrong pick is marked as your answer." }),
        ]),
        reviewList,
        el("div", { class: "pager" }, [
          el("button", {
            type: "button",
            text: "Try again",
            onclick: function () {
              renderReviewQuiz(id);
            },
          }),
          el("a", { class: "button primary", href: "#/reviews", text: "All reviews" }),
        ])
      );
    }

    drawQuestion();
  }

  function renderMissing() {
    setNav("lessons");
    clear(main);
    main.append(
      el("header", { class: "page-head" }, [
        el("h1", { text: "That page is not in the app yet." }),
      ]),
      el("a", { class: "back", href: "#/lessons", text: "All lessons" })
    );
  }

  function route() {
    const parts = (location.hash.replace(/^#/, "") || "/lessons").split("/").filter(Boolean);
    if (parts[0] === "review" && parts[1]) {
      renderReviewQuiz(parts[1]);
      return;
    }
    if (parts[0] === "reviews") {
      renderReviews();
      return;
    }
    if (parts[0] === "vocabulary") {
      const number = Number(parts[1]);
      const activity = parts[2];
      if (parts[1]) {
        if (activity === "study") renderVocabStudy(number);
        else if (activity === "meaning" || activity === "word") renderVocabQuiz(number, activity);
        else renderVocabChapter(number);
        return;
      }
      renderVocabulary();
      return;
    }
    if (parts[0] === "lesson" && parts[1]) {
      const number = Number(parts[1]);
      const activity = parts[2];
      stopSpeech();
      if (activity === "study") renderStudy(number);
      else if (activity === "practice1" || activity === "practice2") renderQuiz(number, activity);
      else renderLesson(number);
      return;
    }
    renderLessons();
  }

  window.addEventListener("hashchange", function () {
    stopSpeech();
    route();
  });
  route();
})();
