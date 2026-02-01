import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    questions: [],
    currentQuestionIndex: 0,
    answers: [], // { questionId, selectedOption, selectedIndex }
    studentId: null,
    testId: null,
    startTime: null,
    isFinished: false,
    score: null,
};

export const testSlice = createSlice({
    name: 'test',
    initialState,
    reducers: {
        startTestSession: (state, action) => {
            state.studentId = action.payload.studentId;
            state.testId = action.payload.testId || null;
            state.startTime = Date.now();
            state.questions = []; // Will be populated
            state.currentQuestionIndex = 0;
            state.answers = [];
            state.isFinished = false;
            state.score = null;
        },
        setQuestions: (state, action) => {
            state.questions = action.payload;
        },
        answerQuestion: (state, action) => {
            const { questionId, selectedOption, selectedIndex } = action.payload;
            // Check if answer already exists, update it
            const existingIndex = state.answers.findIndex(a => a.questionId === questionId);
            if (existingIndex !== -1) {
                state.answers[existingIndex].selectedOption = selectedOption;
                state.answers[existingIndex].selectedIndex = selectedIndex;
            } else {
                state.answers.push({ questionId, selectedOption, selectedIndex });
            }
        },
        nextQuestion: (state) => {
            if (state.currentQuestionIndex < state.questions.length - 1) {
                state.currentQuestionIndex += 1;
            }
        },
        prevQuestion: (state) => {
            if (state.currentQuestionIndex > 0) {
                state.currentQuestionIndex -= 1;
            }
        },
        finishTest: (state) => {
            state.isFinished = true;
        },
        setScore: (state, action) => {
            state.score = action.payload;
        }
    },
});

export const { startTestSession, setQuestions, answerQuestion, nextQuestion, prevQuestion, finishTest, setScore } = testSlice.actions;
export default testSlice.reducer;
