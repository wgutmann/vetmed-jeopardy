globalThis.process ??= {}; globalThis.process.env ??= {};
/* empty css                                 */
import { c as createComponent, a as createAstro, b as addAttribute, r as renderHead, f as renderSlot, h as renderTemplate, i as renderComponent } from '../chunks/astro/server_DfC-QHMz.mjs';
import { a as reactExports, R as React } from '../chunks/_@astro-renderers_CCFqxJvH.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_CCFqxJvH.mjs';

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="Vet Med Jeopardy Game"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "C:/dev/vetmed-jeopardy/src/layouts/Layout.astro", void 0);

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f=reactExports,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:true,ref:true,__self:true,__source:true};
function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a) void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;

{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}

var jsxRuntimeExports = jsxRuntime.exports;

var GameStatus = /* @__PURE__ */ ((GameStatus2) => {
  GameStatus2["IDLE"] = "IDLE";
  GameStatus2["LOADING"] = "LOADING";
  GameStatus2["PLAYING"] = "PLAYING";
  GameStatus2["GAME_OVER"] = "GAME_OVER";
  return GameStatus2;
})(GameStatus || {});

const REQUEST_TIMEOUT_MS = 25e3;
const generateGameContent = async (existingCategories = []) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ existingCategories }),
      signal: controller.signal
    });
    const text = await res.text();
    if (!res.ok) {
      const errorPayload = safeParse(text);
      throw new Error(errorPayload?.error || "Failed to generate game content");
    }
    const parsed = safeParse(text);
    if (!parsed) {
      throw new Error("AI service returned an invalid response");
    }
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
};
const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const GameBoard = ({ categories, onClueClick, readOnly = false }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-7xl mx-auto p-4 md:p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto pb-4 scrollbar-hide", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-[900px] grid grid-cols-6 gap-2 md:gap-4", children: [
    categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "bg-jeopardy-blue aspect-[4/3] flex items-center justify-center p-2 text-center border-2 border-black/30 shadow-lg rounded-sm",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-white font-bold text-sm md:text-lg uppercase tracking-wide drop-shadow-md font-display", children: cat.title })
      },
      cat.id
    )),
    [0, 1, 2, 3, 4].map((rowIndex) => /* @__PURE__ */ jsxRuntimeExports.jsx(React.Fragment, { children: categories.map((cat) => {
      const clue = cat.clues[rowIndex];
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => !readOnly && !clue.isAnswered && onClueClick(clue),
          disabled: readOnly || clue.isAnswered,
          className: `
                      aspect-[4/3] flex items-center justify-center 
                      border-2 border-black/30 rounded-sm shadow-md transition-all duration-200
                      ${clue.isAnswered ? "bg-jeopardy-blue/40 cursor-default" : readOnly ? "bg-jeopardy-blue cursor-default" : "bg-jeopardy-blue hover:bg-blue-800 hover:brightness-110 hover:scale-[1.02] cursor-pointer"}
                    `,
          children: !clue.isAnswered && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold font-display font-bold text-2xl md:text-4xl drop-shadow-sm", children: "$" + clue.value })
        },
        clue.id
      );
    }) }, `row-${rowIndex}`))
  ] }) }) });
};

const ClueModal = ({
  clue,
  players,
  onClose,
  onAwardPoints,
  buzzerState,
  onArmBuzzers,
  onResetBuzzers,
  isPreview = false
}) => {
  const [step, setStep] = reactExports.useState(clue.isDailyDouble ? "DAILY_DOUBLE_WAGER" : "CLUE");
  const [wager, setWager] = reactExports.useState(0);
  const [wagerInput, setWagerInput] = reactExports.useState("");
  const currentPointValue = clue.isDailyDouble ? wager : clue.value;
  const buzzedPlayer = players.find((p) => p.id === buzzerState.buzzedPlayerId);
  const handleWagerSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(wagerInput, 10);
    if (!isNaN(val) && val >= 0) {
      setWager(val);
      setStep("CLUE");
    }
  };
  const handleAward = (playerId, delta) => {
    onAwardPoints(playerId, delta);
    if (delta < 0 && !clue.isDailyDouble) {
      onResetBuzzers();
    } else {
      onClose();
    }
  };
  const handlePass = () => {
    onAwardPoints(null, 0);
    onClose();
  };
  if (step === "DAILY_DOUBLE_WAGER") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-2xl bg-gradient-to-b from-blue-900 to-jeopardy-dark border-4 border-jeopardy-gold rounded-xl shadow-2xl overflow-hidden flex flex-col items-center p-8 text-center animate-in zoom-in duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 transform hover:scale-105 transition-transform duration-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-6xl md:text-8xl font-display font-bold text-jeopardy-gold drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter -rotate-2", children: "DAILY" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-6xl md:text-8xl font-display font-bold text-jeopardy-gold drop-shadow-[0_4px_0_rgba(0,0,0,1)] tracking-tighter rotate-2", children: "DOUBLE" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/80 text-lg mb-6", children: "Enter your wager" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleWagerSubmit, className: "w-full max-w-sm flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-jeopardy-gold text-2xl font-bold", children: "$" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              value: wagerInput,
              onChange: (e) => setWagerInput(e.target.value),
              className: "w-full bg-black/40 border-2 border-jeopardy-gold/50 rounded-lg py-4 pl-10 pr-4 text-3xl text-white font-bold text-center focus:outline-none focus:border-jeopardy-gold transition-colors",
              placeholder: "0",
              autoFocus: true,
              min: "0"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: !wagerInput,
            className: "w-full py-4 bg-jeopardy-gold hover:bg-yellow-400 text-jeopardy-dark font-bold text-xl rounded-lg uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            children: "Place Wager"
          }
        )
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `
        w-full max-w-5xl bg-jeopardy-blue border-4 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]
        ${clue.isDailyDouble ? "border-jeopardy-gold shadow-yellow-500/20" : "border-white/20"}
      `, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-900/50 p-4 text-center border-b border-white/10 shrink-0 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-8" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center", children: [
        clue.isDailyDouble && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold text-xs font-bold uppercase tracking-widest mb-1", children: "Daily Double" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold text-4xl font-bold font-display drop-shadow-md", children: "$" + currentPointValue })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onClose,
          className: "text-white/50 hover:text-white transition-colors",
          title: "Close without scoring",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-grow flex flex-col items-center justify-center p-6 md:p-12 text-center relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "z-10 max-w-4xl flex flex-col items-center gap-6", children: [
        clue.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: clue.imageUrl,
            alt: "Clue Visual",
            className: "max-h-[35vh] w-auto rounded-lg shadow-2xl border-2 border-white/20 object-contain bg-black/20"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white text-3xl md:text-6xl font-bold uppercase leading-snug drop-shadow-lg tracking-wide font-display", children: clue.question })
      ] }),
      !clue.isDailyDouble && buzzedPlayer && step === "CLUE" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in duration-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 uppercase tracking-widest mb-2", children: "Buzzed In" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-jeopardy-gold text-6xl font-display font-bold animate-bounce", children: buzzedPlayer.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleAward(buzzedPlayer.id, currentPointValue), className: "bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-green-500", children: "Correct (+)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleAward(buzzedPlayer.id, -currentPointValue), className: "bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-red-500", children: "Incorrect (-)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onResetBuzzers, className: "mt-4 text-white/50 hover:text-white underline", children: "Ignore / Reset" })
      ] }),
      step === "ANSWER" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 z-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-jeopardy-gold text-xl uppercase font-bold mb-2", children: "Correct Response" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white text-2xl md:text-4xl font-medium bg-black/30 p-6 rounded-lg border border-white/10 inline-block", children: clue.answer })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-black/20 p-6 border-t border-white/10 shrink-0", children: [
      !clue.isDailyDouble && step === "CLUE" && !isPreview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
        buzzerState.status === "LOCKED" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: onArmBuzzers,
            className: "w-full max-w-md py-4 bg-jeopardy-gold text-jeopardy-dark font-bold text-2xl rounded-lg uppercase tracking-widest shadow-lg hover:bg-yellow-300 active:scale-95 transition-all",
            children: "Open Buzzers"
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white text-xl font-mono animate-pulse", children: "--- BUZZERS OPEN ---" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px w-full bg-white/10 my-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setStep("ANSWER"),
            className: "px-8 py-2 bg-blue-800 text-white font-bold rounded-full text-sm hover:bg-blue-700 uppercase tracking-wider",
            children: "Reveal Answer (No Correct Buzz)"
          }
        )
      ] }),
      isPreview && step === "CLUE" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setStep("ANSWER"),
          className: "px-8 py-2 bg-blue-800 text-white font-bold rounded-full text-sm hover:bg-blue-700 uppercase tracking-wider",
          children: "Reveal Answer"
        }
      ) }),
      (step === "ANSWER" || clue.isDailyDouble) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-white/70 uppercase tracking-widest text-sm font-semibold", children: "Manual Adjustments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-4 w-full", children: players.map((player) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 bg-blue-900/40 p-2 rounded-lg border border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-center text-xs truncate max-w-[100px]", children: player.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleAward(player.id, currentPointValue), className: "flex-1 py-1 px-2 bg-green-600 text-white rounded text-xs", children: "+" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleAward(player.id, -currentPointValue), className: "flex-1 py-1 px-2 bg-red-600 text-white rounded text-xs", children: "-" })
          ] })
        ] }, player.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handlePass, className: "mt-2 text-white/50 text-sm hover:underline", children: "Finish Clue" })
      ] })
    ] })
  ] }) });
};

const LoadingScreen = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 bg-jeopardy-dark flex flex-col items-center justify-center z-50 text-white", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-32 h-32 mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 border-t-4 border-jeopardy-gold rounded-full animate-spin" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-4 border-r-4 border-jeopardy-blue rounded-full animate-spin animation-delay-200" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-8 border-b-4 border-white rounded-full animate-spin animation-delay-500" })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold font-display tracking-wider mb-4 animate-pulse text-jeopardy-gold", children: "GENERATING BOARD" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-blue-200 max-w-md text-center px-4", children: "Consulting the AI Veterinary Board Specialists to prepare your exam..." })
] });

const ScoreBoard = ({ players }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-black/90 border-t border-white/10 p-2 md:p-4 backdrop-blur-md z-40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4 mb-2 md:mb-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-jeopardy-blue rounded-full flex items-center justify-center border border-white/20 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: "🩺" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/70 font-medium hidden md:inline", children: "VetMed Jeopardy" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-center gap-4 md:gap-8 overflow-x-auto", children: players.map((player) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center min-w-[80px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold font-display font-bold text-2xl md:text-3xl drop-shadow-md", children: "$" + player.score }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white/80 text-sm font-medium uppercase tracking-wide truncate max-w-[120px]", children: player.name })
    ] }, player.id)) })
  ] }) });
};

const PlayerController = ({
  name,
  score,
  status,
  onBuzz,
  boardData,
  activeClue
}) => {
  let buttonText = "WAIT";
  let disabled = true;
  let buttonColor = "bg-red-900/50";
  if (status === "ARMED") {
    buttonColor = "bg-green-600 hover:bg-green-500 active:bg-green-400";
    buttonText = "BUZZ!";
    disabled = false;
  } else if (status === "BUZZED") {
    buttonColor = "bg-jeopardy-gold text-jeopardy-dark";
    buttonText = "LOCKED IN";
  } else {
    buttonColor = "bg-red-900/50";
    buttonText = "LOCKED";
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-jeopardy-dark flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-900 p-4 flex justify-between items-center border-b border-white/10 shrink-0 z-10 shadow-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-lg truncate max-w-[150px]", children: name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold font-display font-bold text-2xl", children: "$" + score })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-grow flex flex-col relative overflow-hidden", children: activeClue ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center p-6 bg-jeopardy-blue z-20 animate-in slide-in-from-bottom-4 duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 text-center space-y-4 max-w-lg flex flex-col items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-jeopardy-gold font-display font-bold text-4xl", children: "$" + activeClue.value }),
        activeClue.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: activeClue.imageUrl,
            alt: "Clue Visual",
            className: "max-h-32 w-auto rounded shadow-md border border-white/20 mb-2"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium text-xl md:text-2xl leading-relaxed uppercase font-display tracking-wide", children: activeClue.question })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: onBuzz,
          disabled,
          className: `
                  w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl border-8 border-white/10
                  flex items-center justify-center text-3xl md:text-5xl font-bold tracking-widest
                  transition-all duration-100 active:scale-95
                  ${buttonColor} text-white
                `,
          children: buttonText
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 text-white/50 text-sm uppercase tracking-widest animate-pulse", children: status === "ARMED" ? "Quick! Tap now!" : "Waiting for Host..." })
    ] }) : (
      /* View 2: Game Board (Read Only) */
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-grow overflow-y-auto bg-jeopardy-dark", children: boardData ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none opacity-100 origin-top scale-90 md:scale-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GameBoard, { categories: boardData.categories, onClueClick: () => {
      }, readOnly: true }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full items-center justify-center text-white/30", children: "Waiting for game to start..." }) })
    ) })
  ] });
};

const getBaseUrl = () => {
  const configured = "https://z8w3v8e3ri.us-east-2.awsapprunner.com";
  return configured.replace(/\/$/, "");
};
const toWsUrl = (url) => url.replace(/^http/, "ws");
const createHostSession = async () => {
  const res = await fetch(`${getBaseUrl()}/rooms`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create room");
  return res.json();
};
const joinRoomSession = async (roomCode, name) => {
  const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Unable to join room");
  }
  return res.json();
};
const connectRealtime = (options) => {
  let socket = null;
  let stopped = false;
  let attempt = 0;
  const url = `${toWsUrl(getBaseUrl())}/ws?token=${options.token}`;
  const connect = () => {
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      attempt = 0;
      options.onOpen?.();
    });
    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.from === "HOST") options.onHostMessage?.(payload.message);
        else if (payload.from === "PLAYER") {
          options.onPlayerMessage?.({ playerId: payload.playerId, message: payload.message });
        }
      } catch (err) {
        console.error("Failed to parse realtime payload", err);
      }
    });
    socket.addEventListener("close", () => {
      options.onClose?.();
      if (!stopped) scheduleReconnect();
    });
    socket.addEventListener("error", () => {
      socket?.close();
    });
  };
  const scheduleReconnect = () => {
    attempt += 1;
    const delay = Math.min(1e4, 1e3 * Math.pow(2, attempt));
    setTimeout(() => {
      if (!stopped) connect();
    }, delay);
  };
  connect();
  return {
    close: () => {
      stopped = true;
      socket?.close();
    },
    sendToAll: (message) => {
      if (options.role !== "HOST") return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ target: "ALL", message }));
    },
    sendToPlayer: (playerId, message) => {
      if (options.role !== "HOST") return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ target: "PLAYER", playerId, message }));
    },
    sendToHost: (message) => {
      if (options.role !== "PLAYER") return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ message }));
    }
  };
};

const App = () => {
  const [mode, setMode] = reactExports.useState("LANDING");
  const [roomCode, setRoomCode] = reactExports.useState("");
  const [status, setStatus] = reactExports.useState(GameStatus.IDLE);
  const [boardData, setBoardData] = reactExports.useState(null);
  const [isPreviewing, setIsPreviewing] = reactExports.useState(false);
  const [players, setPlayers] = reactExports.useState([]);
  const [activeClue, setActiveClue] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [isGenerating, setIsGenerating] = reactExports.useState(false);
  const [gameSource, setGameSource] = reactExports.useState("AI");
  const [csvContent, setCsvContent] = reactExports.useState("");
  const [clientName, setClientName] = reactExports.useState("");
  const [clientRoomInput, setClientRoomInput] = reactExports.useState("");
  const [clientScore, setClientScore] = reactExports.useState(0);
  const [clientBoardData, setClientBoardData] = reactExports.useState(null);
  const [clientActiveClue, setClientActiveClue] = reactExports.useState(null);
  const [joinError, setJoinError] = reactExports.useState("");
  const [buzzerState, setBuzzerState] = reactExports.useState({ status: "LOCKED", buzzedPlayerId: null });
  const realtimeRef = reactExports.useRef(null);
  const lastPongRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const heartbeatTimerRef = reactExports.useRef(null);
  const hostTokenRef = reactExports.useRef(null);
  const playerSessionRef = reactExports.useRef(null);
  const initializeHost = async () => {
    setMode("HOST");
    setError(null);
    try {
      const session = await createHostSession();
      hostTokenRef.current = session.hostToken;
      setRoomCode(session.roomCode);
      connectHostRealtime(session.hostToken);
    } catch (err) {
      console.error("Failed to initialize host session:", err);
      setError(err?.message || "Could not start host session");
    }
  };
  const connectHostRealtime = (token) => {
    realtimeRef.current?.close();
    realtimeRef.current = connectRealtime({
      token,
      role: "HOST",
      onPlayerMessage: ({ playerId, message }) => handleHostMessage(playerId, message),
      onOpen: () => {
        setError(null);
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = setInterval(() => runHeartbeat(), 5e3);
      },
      onClose: () => {
        setError("Lost connection to the signaling service. Attempting to reconnect...");
      }
    });
  };
  const runHeartbeat = () => {
    const now = Date.now();
    realtimeRef.current?.sendToAll({ type: "PING", payload: { t: now } });
    setPlayers((prev) => prev.map((player) => {
      const last = lastPongRef.current.get(player.id) || 0;
      return { ...player, isConnected: now - last < 15e3 };
    }));
  };
  const sanitizeBoard = (data) => ({
    categories: data.categories.map((c) => ({
      ...c,
      clues: c.clues.map((clue) => ({ ...clue, answer: "HIDDEN ON CLIENT" }))
    }))
  });
  const handleHostMessage = (playerId, msg) => {
    switch (msg.type) {
      case "JOIN":
        const newPlayer = {
          id: playerId,
          name: msg.payload.name.substring(0, 12),
          // Limit name length
          score: 0,
          isConnected: true
        };
        setPlayers((prev) => {
          const exists = prev.find((p) => p.id === newPlayer.id);
          if (exists) return prev;
          return [...prev, newPlayer];
        });
        lastPongRef.current.set(playerId, Date.now());
        realtimeRef.current?.sendToPlayer(playerId, { type: "WELCOME", payload: { score: 0 } });
        if (boardData) {
          realtimeRef.current?.sendToPlayer(playerId, { type: "BOARD_UPDATE", payload: sanitizeBoard(boardData) });
        }
        if (activeClue) {
          realtimeRef.current?.sendToPlayer(playerId, { type: "CLUE_SELECTED", payload: { ...activeClue, answer: "HIDDEN" } });
          realtimeRef.current?.sendToPlayer(playerId, { type: "BUZZER_STATUS", payload: buzzerState });
        }
        break;
      case "RESYNC":
        realtimeRef.current?.sendToPlayer(playerId, { type: "BOARD_UPDATE", payload: boardData ? sanitizeBoard(boardData) : null });
        if (activeClue) realtimeRef.current?.sendToPlayer(playerId, { type: "CLUE_SELECTED", payload: { ...activeClue, answer: "HIDDEN" } });
        realtimeRef.current?.sendToPlayer(playerId, { type: "BUZZER_STATUS", payload: buzzerState });
        break;
      case "PONG":
        lastPongRef.current.set(playerId, Date.now());
        setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, isConnected: true } : p));
        break;
      case "BUZZ":
        setBuzzerState((current) => {
          if (current.status === "ARMED") {
            const winnerId = playerId;
            broadcast({ type: "BUZZER_STATUS", payload: { status: "BUZZED", buzzedPlayerId: winnerId } });
            return { status: "BUZZED", buzzedPlayerId: winnerId };
          }
          return current;
        });
        break;
    }
  };
  const broadcast = (msg) => {
    realtimeRef.current?.sendToAll(msg);
  };
  const syncScoreToPlayer = (playerId, newScore) => {
    realtimeRef.current?.sendToPlayer(playerId, { type: "UPDATE_PLAYERS", payload: { score: newScore } });
  };
  const startHostGame = reactExports.useCallback(async () => {
    setError(null);
    try {
      setIsGenerating(true);
      let finalBoard = boardData;
      if (!finalBoard) {
        setStatus(GameStatus.LOADING);
        let categories = [];
        if (gameSource === "CSV") {
          if (!csvContent.trim()) throw new Error("Please paste CSV content.");
          const parsed = parseCSV(csvContent);
          if (parsed.length === 0) throw new Error("Invalid CSV.");
          const isComplete = parsed.length === 6 && parsed.every((c) => c.clues.length === 5);
          if (isComplete) {
            categories = parsed;
          } else {
            const rawData = await generateGameContent(parsed);
            categories = rawData.categories;
          }
        } else {
          const rawData = await generateGameContent([]);
          categories = rawData.categories;
        }
        finalBoard = processBoardData(categories);
        setBoardData(finalBoard);
      }
      setStatus(GameStatus.PLAYING);
      broadcast({ type: "BOARD_UPDATE", payload: sanitizeBoard(finalBoard) });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to initialize.");
      setStatus(GameStatus.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [gameSource, csvContent]);
  const previewBoard = reactExports.useCallback(async () => {
    setError(null);
    try {
      setIsGenerating(true);
      let finalBoard = boardData;
      if (!finalBoard) {
        setStatus(GameStatus.LOADING);
        let categories = [];
        if (gameSource === "CSV") {
          if (!csvContent.trim()) throw new Error("Please paste CSV content.");
          const parsed = parseCSV(csvContent);
          if (parsed.length === 0) throw new Error("Invalid CSV.");
          const isComplete = parsed.length === 6 && parsed.every((c) => c.clues.length === 5);
          if (isComplete) {
            categories = parsed;
          } else {
            const rawData = await generateGameContent(parsed);
            categories = rawData.categories;
          }
        } else {
          const rawData = await generateGameContent();
          categories = rawData.categories;
        }
        finalBoard = processBoardData(categories);
        setBoardData(finalBoard);
      }
      setIsPreviewing(true);
      setStatus(GameStatus.IDLE);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate preview.");
      setStatus(GameStatus.IDLE);
    } finally {
      setIsGenerating(false);
    }
  }, [gameSource, csvContent, boardData]);
  const joinGame = async () => {
    if (!clientName || !clientRoomInput) {
      setJoinError("Name and Room Code required.");
      return;
    }
    setJoinError("");
    try {
      const session = await joinRoomSession(clientRoomInput.trim().toUpperCase(), clientName);
      playerSessionRef.current = {
        token: session.playerToken,
        playerId: session.playerId,
        roomCode: session.roomCode,
        name: clientName
      };
      realtimeRef.current?.close();
      realtimeRef.current = connectRealtime({
        token: session.playerToken,
        role: "PLAYER",
        onHostMessage: (message) => handleClientMessage(message),
        onOpen: () => {
          setMode("PLAYER");
          realtimeRef.current?.sendToHost({ type: "JOIN", payload: { name: clientName } });
          realtimeRef.current?.sendToHost({ type: "RESYNC", payload: {} });
        },
        onClose: () => {
          setJoinError("Connection lost. Reconnecting...");
        }
      });
    } catch (err) {
      console.error("Failed to initialize client session:", err);
      setJoinError(err?.message || "Failed to join game");
    }
  };
  const handleClientMessage = (msg) => {
    switch (msg.type) {
      case "WELCOME":
      case "UPDATE_PLAYERS":
        if (msg.payload.score !== void 0) setClientScore(msg.payload.score);
        break;
      case "PING":
        realtimeRef.current?.sendToHost({ type: "PONG", payload: { t: msg.payload?.t } });
        break;
      case "BOARD_UPDATE":
        setClientBoardData(msg.payload);
        break;
      case "CLUE_SELECTED":
        setClientActiveClue(msg.payload);
        break;
      case "CLUE_CLOSED":
        setClientActiveClue(null);
        break;
      case "BUZZER_STATUS":
        setBuzzerState({
          status: msg.payload.status,
          buzzedPlayerId: msg.payload.buzzedPlayerId
        });
        break;
    }
  };
  const sendBuzz = () => {
    realtimeRef.current?.sendToHost({ type: "BUZZ", payload: {} });
  };
  reactExports.useEffect(() => {
    return () => {
      realtimeRef.current?.close();
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, []);
  const processBoardData = (categories) => {
    let processedCategories = categories.map((cat, catIndex) => ({
      ...cat,
      id: `cat-${catIndex}`,
      clues: cat.clues.map((clue, clueIndex) => ({
        ...clue,
        id: `clue-${catIndex}-${clueIndex}`,
        isAnswered: false,
        isDailyDouble: false
      })).sort((a, b) => a.value - b.value)
    }));
    const allClues = [];
    processedCategories.forEach((cat, catIdx) => {
      cat.clues.forEach((_, clueIdx) => {
        allClues.push({ catIdx, clueIdx });
      });
    });
    if (allClues.length > 0) {
      const randomIndices = allClues[Math.floor(Math.random() * allClues.length)];
      processedCategories[randomIndices.catIdx].clues[randomIndices.clueIdx].isDailyDouble = true;
    }
    return { categories: processedCategories };
  };
  const parseCSV = (text) => {
    const lines = text.split("\n");
    const categoriesMap = {};
    lines.forEach((line) => {
      if (!line.trim()) return;
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const parts = matches ? matches.map((m) => m.replace(/^"|"$/g, "").trim()) : line.split(",").map((s) => s.trim());
      if (parts.length >= 4) {
        const category = parts[0];
        const value = parseInt(parts[1], 10);
        const question = parts[2];
        const answer = parts[3];
        const imageUrl = parts.length > 4 ? parts[4] : void 0;
        if (!categoriesMap[category]) categoriesMap[category] = [];
        if (!isNaN(value)) {
          categoriesMap[category].push({
            value,
            question,
            answer,
            imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : void 0
          });
        }
      }
    });
    return Object.keys(categoriesMap).map((title) => ({
      id: "",
      title,
      clues: categoriesMap[title]
    }));
  };
  const handleClueClick = (clue) => {
    setActiveClue(clue);
    broadcast({ type: "CLUE_SELECTED", payload: { ...clue, answer: "HIDDEN" } });
    const newBuzzerState = { status: "LOCKED", buzzedPlayerId: null };
    setBuzzerState(newBuzzerState);
    broadcast({ type: "BUZZER_STATUS", payload: newBuzzerState });
  };
  const handlePreviewClueClick = (clue) => {
    setActiveClue(clue);
  };
  const handleArmBuzzers = () => {
    const newState = { status: "ARMED", buzzedPlayerId: null };
    setBuzzerState(newState);
    broadcast({ type: "BUZZER_STATUS", payload: newState });
  };
  const handleResetBuzzers = () => {
    handleArmBuzzers();
  };
  const handleCloseClueModal = () => {
    setActiveClue(null);
    setBuzzerState({ status: "LOCKED", buzzedPlayerId: null });
    broadcast({ type: "CLUE_CLOSED", payload: {} });
    broadcast({ type: "BUZZER_STATUS", payload: { status: "LOCKED", buzzedPlayerId: null } });
  };
  const handleAwardPoints = (playerId, points) => {
    if (!boardData) return;
    if (playerId) {
      let newScore = 0;
      setPlayers((prev) => prev.map((p) => {
        if (p.id === playerId) {
          newScore = p.score + points;
          return { ...p, score: newScore };
        }
        return p;
      }));
      syncScoreToPlayer(playerId, newScore);
    }
    if (points >= 0 || activeClue?.isDailyDouble) {
      const newCategories = boardData.categories.map((cat) => ({
        ...cat,
        clues: cat.clues.map((c) => {
          if (c.id === activeClue?.id) {
            return { ...c, isAnswered: true, winnerId: playerId || void 0 };
          }
          return c;
        })
      }));
      const newBoard = { categories: newCategories };
      setBoardData(newBoard);
      broadcast({ type: "BOARD_UPDATE", payload: sanitizeBoard(newBoard) });
      handleCloseClueModal();
    }
  };
  if (mode === "PLAYER") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      PlayerController,
      {
        name: clientName,
        score: clientScore,
        status: buzzerState.status,
        onBuzz: sendBuzz,
        boardData: clientBoardData,
        activeClue: clientActiveClue
      }
    );
  }
  if (mode === "LANDING") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-900 to-black flex flex-col items-center justify-center p-6 text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl md:text-6xl font-display font-bold text-jeopardy-gold mb-12 text-center drop-shadow-lg", children: "VET MED JEOPARDY" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-8 w-full max-w-4xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/15 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-4", children: "📺" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-4", children: "HOST A GAME" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-center mb-8", children: "Create a game board on this screen. Players can join using their phones." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: initializeHost,
              className: "px-8 py-3 bg-jeopardy-blue hover:bg-blue-600 text-white font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full",
              children: "START AS HOST"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10 flex flex-col items-center hover:bg-white/15 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-4", children: "📱" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-4", children: "JOIN GAME" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-center mb-4", children: "Enter the Room Code displayed on the Host screen." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "YOUR NAME",
                value: clientName,
                onChange: (e) => setClientName(e.target.value),
                className: "w-full bg-black/30 border border-white/30 rounded-lg px-4 py-3 text-center font-bold focus:border-jeopardy-gold outline-none"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                placeholder: "ROOM CODE (e.g. ABCD)",
                value: clientRoomInput,
                onChange: (e) => setClientRoomInput(e.target.value),
                maxLength: 4,
                className: "w-full bg-black/30 border border-white/30 rounded-lg px-4 py-3 text-center font-bold uppercase tracking-widest focus:border-jeopardy-gold outline-none"
              }
            ),
            joinError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm text-center", children: joinError }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: joinGame,
                disabled: !clientName || clientRoomInput.length < 4,
                className: "px-8 py-3 bg-jeopardy-gold text-blue-900 hover:bg-yellow-400 font-bold rounded-full shadow-lg transition-transform hover:scale-105 w-full disabled:opacity-50 disabled:scale-100",
                children: "JOIN"
              }
            )
          ] })
        ] })
      ] })
    ] });
  }
  if (status === GameStatus.IDLE) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-950 to-black flex flex-col items-center justify-center p-4 text-center overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-4xl w-full space-y-8 animate-in fade-in zoom-in duration-700 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/50 text-sm font-bold tracking-widest uppercase", children: "ROOM CODE" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl font-mono font-bold text-jeopardy-gold bg-white/10 inline-block px-8 py-4 rounded-xl border-2 border-jeopardy-gold/50 tracking-[0.5em]", children: roomCode }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/30 text-xs", children: "Join at this URL on your phone" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:grid-cols-2 gap-8 text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl text-white font-bold mb-4 uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "👥" }),
            " Players (",
            players.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 mb-6 max-h-64 overflow-y-auto custom-scrollbar", children: [
            players.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/30 italic text-center py-8", children: "Waiting for players to join..." }),
            players.map((player) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center bg-white/10 px-3 py-3 rounded animate-in fade-in slide-in-from-left-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white font-bold text-lg", children: player.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-green-400 text-xs", children: "CONNECTED" })
            ] }, player.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xl text-white font-bold mb-4 uppercase tracking-widest flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "⚙️" }),
            " Game Data"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex bg-black/40 p-1 rounded-lg mb-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setGameSource("AI"),
                className: `flex-1 py-2 rounded-md font-bold text-sm transition-all ${gameSource === "AI" ? "bg-jeopardy-blue text-white shadow-md" : "text-white/50 hover:text-white"}`,
                children: "AI Generator"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setGameSource("CSV"),
                className: `flex-1 py-2 rounded-md font-bold text-sm transition-all ${gameSource === "CSV" ? "bg-jeopardy-blue text-white shadow-md" : "text-white/50 hover:text-white"}`,
                children: "CSV Upload"
              }
            )
          ] }),
          gameSource === "AI" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center text-center p-4 border-2 border-dashed border-white/10 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/60 text-sm", children: "The AI will automatically generate 6 categories." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: csvContent,
              onChange: (e) => setCsvContent(e.target.value),
              placeholder: `Category, Value, Question, Answer, [ImageURL]

Tip: If you provide fewer than 6 categories, AI will fill in the rest!`,
              className: "flex-1 w-full bg-black/40 border border-white/20 rounded p-3 text-xs font-mono text-white/80 focus:outline-none focus:border-jeopardy-gold resize-none min-h-[150px]"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: previewBoard,
              disabled: isGenerating,
              className: `px-4 py-2 rounded-md text-sm text-white/80 ${isGenerating ? "bg-white/6 cursor-wait" : "bg-white/10 hover:bg-white/20"}`,
              children: isGenerating ? "Generating…" : "Preview Board"
            }
          ) })
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 bg-red-500/20 border border-red-500 text-red-200 rounded-lg max-w-2xl mx-auto", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: startHostGame,
          disabled: players.length === 0 || isGenerating,
          className: "group relative inline-flex items-center justify-center px-16 py-5 overflow-hidden font-bold text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none disabled:opacity-50 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-100 group-hover:opacity-90" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative text-2xl tracking-widest font-display", children: "START GAME" })
          ]
        }
      )
    ] }) });
  }
  if (isGenerating) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingScreen, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gradient-to-b from-blue-900 to-slate-900 flex flex-col relative pb-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-blue-950/50 border-b border-white/5 p-4 shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-jeopardy-gold text-jeopardy-dark font-bold px-3 py-1 rounded text-sm", children: [
          "CODE: ",
          roomCode
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-white font-display font-bold text-xl tracking-wide hidden md:block", children: "VET MED JEOPARDY" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setStatus(GameStatus.IDLE),
          className: "text-xs text-blue-300 hover:text-white uppercase tracking-widest border border-blue-300/30 px-3 py-1 rounded hover:bg-blue-800 transition-colors",
          children: "End Game"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "flex-grow flex items-center", children: [
      isPreviewing && boardData && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto text-white/70 px-4 md:px-8 mb-2", children: "Preview Mode — clicking clues will NOT broadcast to players" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GameBoard,
          {
            categories: boardData.categories,
            onClueClick: (clue) => handlePreviewClueClick(clue),
            readOnly: false
          }
        )
      ] }),
      !isPreviewing && boardData && /* @__PURE__ */ jsxRuntimeExports.jsx(
        GameBoard,
        {
          categories: boardData.categories,
          onClueClick: handleClueClick
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBoard, { players }),
    activeClue && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ClueModal,
      {
        clue: activeClue,
        players,
        onClose: handleCloseClueModal,
        onAwardPoints: handleAwardPoints,
        buzzerState,
        onArmBuzzers: handleArmBuzzers,
        onResetBuzzers: handleResetBuzzers,
        isPreview: isPreviewing
      }
    )
  ] });
};

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Vet Med Jeopardy" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "App", App, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/dev/vetmed-jeopardy/App.tsx", "client:component-export": "default" })} ` })}`;
}, "C:/dev/vetmed-jeopardy/src/pages/index.astro", void 0);

const $$file = "C:/dev/vetmed-jeopardy/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
