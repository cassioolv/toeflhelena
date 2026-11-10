import type { Question } from "./types";

const lecture = "Professor: Today we'll look at why some desert plants open their pores, called stomata, only at night. During the day, the air is extremely hot and dry, so an open pore would lose a lot of water. By opening at night, these plants take in carbon dioxide when it's cooler, store it, and then use it for photosynthesis the next day with their pores closed.";
const passage = "The first public libraries in many towns were funded not by governments but by private donors. Over time, however, citizens began to argue that access to books was a public good. As a result, local taxes were gradually introduced to keep libraries open and free for everyone.";

/** EXEMPLOS DEMONSTRATIVOS — não fazem parte do banco definitivo de 140 questões. */
export const DEMO_QUESTIONS: Question[] = [
  {
    id: "demo-L1", section: "listening", cefr: "A2", demo: true, skill: "Short conversation — inference",
    audioId: "demo-conv", audioUrl: "", maxPlays: 2,
    transcript: "Woman: Are you coming to the movies tonight?\nMan: I'd love to, but I have a chemistry exam tomorrow morning.\nNarrator: What does the man mean?",
    prompt: "What does the man mean?",
    options: { A: "He will go to the movies.", B: "He needs to study tonight.", C: "He already saw the movie.", D: "He doesn't like chemistry." },
    correct: "B", explanation: "\"I'd love to, but...\" introduces a refusal; the exam tomorrow implies he must study.",
    wrongExplanations: { A: "\"But\" signals he will not go.", C: "The movie itself is never discussed.", D: "He mentions the exam, not his feelings about the subject." },
  },
  {
    id: "demo-L2", section: "listening", cefr: "B2", demo: true, skill: "Academic talk — main idea",
    audioId: "demo-lecture", audioUrl: "", maxPlays: 1, transcript: lecture,
    prompt: "What is the talk mainly about?",
    options: { A: "How deserts are formed", B: "Why some plants open their pores at night", C: "How animals find water in deserts", D: "The chemistry of carbon dioxide" },
    correct: "B", explanation: "The professor explicitly states the topic: why some desert plants open stomata only at night.",
    wrongExplanations: { A: "Desert formation is not discussed.", C: "Animals are not mentioned.", D: "CO₂ is a detail, not the main topic." },
  },
  {
    id: "demo-S1", section: "structure", cefr: "B1", demo: true, skill: "Verb tense — present perfect",
    prompt: "Maria ______ in Lisbon since 2019.",
    options: { A: "lives", B: "is living", C: "has lived", D: "lived" },
    correct: "C", explanation: "\"Since\" + a starting point requires the present perfect for an action continuing to now.",
    wrongExplanations: { A: "Simple present does not combine with \"since 2019\".", B: "Present continuous doesn't express duration from a past point.", D: "Simple past implies the action is finished." },
  },
  {
    id: "demo-S2", section: "structure", cefr: "C1", demo: true, skill: "Inversion after negative adverbials",
    prompt: "Not until the results were published ______ how serious the problem was.",
    options: { A: "the researchers realized", B: "did the researchers realize", C: "the researchers did realize", D: "realized the researchers" },
    correct: "B", explanation: "A fronted \"Not until...\" clause triggers auxiliary–subject inversion: \"did the researchers realize\".",
    wrongExplanations: { A: "No inversion — ungrammatical after \"Not until\".", C: "Emphatic \"did\" but still subject-first order.", D: "Main verbs cannot invert with the subject in modern English." },
  },
  {
    id: "demo-R1", section: "reading", cefr: "B1", demo: true, skill: "Detail", passage,
    evidence: "funded not by governments but by private donors",
    prompt: "According to the passage, who first paid for many public libraries?",
    options: { A: "National governments", B: "Private donors", C: "Local taxes", D: "Library users" },
    correct: "B", explanation: "The passage states they were \"funded not by governments but by private donors\".",
    wrongExplanations: { A: "Explicitly negated in the text.", C: "Taxes came later.", D: "Users are not mentioned as funders." },
  },
  {
    id: "demo-R2", section: "reading", cefr: "C1", demo: true, skill: "Inference — cause and effect", passage,
    evidence: "citizens began to argue that access to books was a public good",
    prompt: "It can be inferred that local taxes were introduced because",
    options: { A: "donors stopped giving money", B: "books became more expensive", C: "people came to see libraries as serving everyone", D: "governments closed private libraries" },
    correct: "C", explanation: "\"As a result\" links taxes to the view that book access was a public good.",
    wrongExplanations: { A: "The passage never says donations stopped.", B: "Book prices are not mentioned.", D: "No closures are described." },
  },
];
