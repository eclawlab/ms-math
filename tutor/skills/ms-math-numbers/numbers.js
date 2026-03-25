// eClaw MS Math Numbers & Operations Tutor (6-8).
// Common Core Math 6-8 (Numbers & Operations) aligned.

const { dataDir, loadProfile: _lp, saveProfile: _sp, listProfiles, calcMastery, masteryLabel, shuffle, pick, runCLI, srGrade, srUpdate, srEffectiveMastery, srDueToday, MASTERY_THRESHOLD, saveSessionState, loadSessionState, fsrsUpdateStability, fsrsUpdateDifficulty, fsrsNextReview, today } = require('../_lib/core');
const { buildDiffContext } = require('../_lib/differentiation');
const { DomainSkillBase, buildCommonCLIHandlers, generateExercise: _generateExercise, checkAnswer: _checkAnswer } = require('../_lib/exercise-factory');

const DATA_DIR = dataDir('ms-math-numbers');
const loadProfile = id => _lp(DATA_DIR, id);
const saveProfile = p => _sp(DATA_DIR, p);

const SKILLS = {
  'integer-operations': ['integer-addition', 'integer-subtraction', 'integer-multiplication', 'integer-division', 'order-of-operations', 'absolute-value'],
  'fractions': ['fraction-basics', 'equivalent-fractions', 'comparing-fractions', 'adding-fractions', 'subtracting-fractions', 'multiplying-fractions', 'dividing-fractions'],
  'decimals': ['decimal-place-value', 'decimal-operations', 'converting-fractions-decimals', 'repeating-decimals'],
  'exponents-roots': ['exponent-basics', 'exponent-rules', 'square-roots', 'cube-roots', 'scientific-notation'],
  'number-properties': ['factors-multiples', 'prime-factorization', 'gcf-lcm', 'rational-vs-irrational'],
};

// Prerequisites: topic -> [topics that must be mastered first].
const TOPIC_PREREQUISITES = {
  // integer-operations (foundational)
  'integer-addition': [],
  'integer-subtraction': ['integer-addition'],
  'integer-multiplication': ['integer-subtraction'],
  'integer-division': ['integer-multiplication'],
  'order-of-operations': ['integer-division'],
  'absolute-value': ['integer-addition'],
  // fractions
  'fraction-basics': ['integer-division'],
  'equivalent-fractions': ['fraction-basics'],
  'comparing-fractions': ['equivalent-fractions'],
  'adding-fractions': ['equivalent-fractions'],
  'subtracting-fractions': ['adding-fractions'],
  'multiplying-fractions': ['fraction-basics'],
  'dividing-fractions': ['multiplying-fractions'],
  // decimals
  'decimal-place-value': ['fraction-basics'],
  'decimal-operations': ['decimal-place-value', 'order-of-operations'],
  'converting-fractions-decimals': ['decimal-place-value', 'equivalent-fractions'],
  'repeating-decimals': ['converting-fractions-decimals'],
  // exponents-roots
  'exponent-basics': ['integer-multiplication'],
  'exponent-rules': ['exponent-basics'],
  'square-roots': ['exponent-basics'],
  'cube-roots': ['square-roots'],
  'scientific-notation': ['exponent-rules'],
  // number-properties
  'factors-multiples': ['integer-multiplication', 'integer-division'],
  'prime-factorization': ['factors-multiples'],
  'gcf-lcm': ['prime-factorization'],
  'rational-vs-irrational': ['repeating-decimals', 'square-roots'],
};

// Helper: is a topic unlocked (all prereqs mastered)?
function _numbersTopicUnlocked(topic, profileSkills) {
  return (TOPIC_PREREQUISITES[topic] || []).every(r => (profileSkills[r]?.mastery || 0) >= MASTERY_THRESHOLD);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANKS — 8 questions per skill, Common Core Math 6-8 aligned
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION_BANKS = {
  // ── integer-operations ─────────────────────────────────────────────────────
  'integer-addition': { questions: [
    { q: 'What is 7 + (-3)?', a: '4', type: 'short', difficulty: 1, rule: 'When adding a negative number, subtract its absolute value.' },
    { q: 'What is -5 + (-8)?', a: '-13', type: 'short', difficulty: 1, rule: 'Adding two negatives: add the absolute values and keep the negative sign.' },
    { q: 'True or false: Adding two negative numbers always gives a negative result.', a: 'true', type: 'tf', difficulty: 1, explanation: 'Negative + negative = negative, always.' },
    { q: 'What is -12 + 12?', a: ['0', 'zero'], type: 'multi', difficulty: 1, concept: 'additive inverse' },
    { q: 'What is -25 + 13?', a: '-12', type: 'short', difficulty: 2, hint: 'The negative number has a larger absolute value, so the result is negative.' },
    { q: 'A diver is at -15 meters. She ascends 8 meters. What is her new depth?', a: '-7 meters', type: 'calculation', difficulty: 2, formula: '-15 + 8 = -7' },
    { q: 'What is -34 + (-19) + 10?', a: '-43', type: 'calculation', difficulty: 2, hint: 'Add left to right: -34 + (-19) = -53, then -53 + 10 = -43.' },
    { q: 'Explain why -6 + 6 = 0 using the concept of additive inverses.', a: 'a number and its opposite (additive inverse) always sum to zero because they are the same distance from zero on opposite sides of the number line', type: 'open', difficulty: 3 },
  ]},
  'integer-subtraction': { questions: [
    { q: 'What is 5 - 8?', a: '-3', type: 'short', difficulty: 1, rule: 'Subtracting a larger number from a smaller one gives a negative result.' },
    { q: 'What is -4 - 3?', a: '-7', type: 'short', difficulty: 1, rule: 'Subtracting a positive from a negative: add the absolute values and keep the negative sign.' },
    { q: 'True or false: Subtracting a negative number is the same as adding a positive number.', a: 'true', type: 'tf', difficulty: 1, explanation: 'a - (-b) = a + b' },
    { q: 'What is 10 - (-6)?', a: '16', type: 'short', difficulty: 1, rule: 'Subtracting a negative: change to addition. 10 + 6 = 16.' },
    { q: 'What is -9 - (-4)?', a: '-5', type: 'short', difficulty: 2, hint: '-9 - (-4) = -9 + 4 = -5' },
    { q: 'The temperature was -3°C in the morning and dropped 7°C by night. What was the nighttime temperature?', a: '-10°C', type: 'calculation', difficulty: 2, formula: '-3 - 7 = -10' },
    { q: 'What is -15 - (-20)?', a: '5', type: 'short', difficulty: 2, hint: '-15 - (-20) = -15 + 20 = 5' },
    { q: 'Explain why 3 - 7 gives the same result as 3 + (-7). Use the number line to support your answer.', a: 'subtracting 7 means moving 7 units to the left on the number line which is the same as adding negative 7', type: 'open', difficulty: 3 },
  ]},
  'integer-multiplication': { questions: [
    { q: 'What is 6 × (-3)?', a: '-18', type: 'short', difficulty: 1, rule: 'Positive × negative = negative.' },
    { q: 'What is (-4) × (-5)?', a: '20', type: 'short', difficulty: 1, rule: 'Negative × negative = positive.' },
    { q: 'True or false: The product of two negative numbers is always positive.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is (-7) × 8?', a: '-56', type: 'short', difficulty: 1, rule: 'Negative × positive = negative.' },
    { q: 'What is (-3) × (-4) × (-2)?', a: '-24', type: 'calculation', difficulty: 2, hint: 'An odd number of negative factors gives a negative product.' },
    { q: 'A stock drops $3 each day for 5 days. Write a multiplication expression and find the total change.', a: '5 × (-3) = -15 dollars', type: 'calculation', difficulty: 2 },
    { q: 'What is (-2)^4?', a: '16', type: 'short', difficulty: 2, hint: '(-2) × (-2) × (-2) × (-2) = 16 because there are four (even) negative factors.' },
    { q: 'Explain the rule for determining the sign of a product when multiplying multiple negative numbers.', a: 'if the number of negative factors is even the product is positive and if the number of negative factors is odd the product is negative', type: 'open', difficulty: 3 },
  ]},
  'integer-division': { questions: [
    { q: 'What is (-24) ÷ 6?', a: '-4', type: 'short', difficulty: 1, rule: 'Negative ÷ positive = negative.' },
    { q: 'What is (-36) ÷ (-9)?', a: '4', type: 'short', difficulty: 1, rule: 'Negative ÷ negative = positive.' },
    { q: 'True or false: Dividing a positive number by a negative number gives a positive result.', a: 'false', type: 'tf', difficulty: 1, explanation: 'Positive ÷ negative = negative.' },
    { q: 'What is 45 ÷ (-5)?', a: '-9', type: 'short', difficulty: 1 },
    { q: 'What is (-72) ÷ (-8)?', a: '9', type: 'short', difficulty: 2 },
    { q: 'A submarine descends 120 meters in 4 minutes at a constant rate. Express the rate as an integer.', a: '-30 meters per minute', type: 'calculation', difficulty: 2, formula: '-120 ÷ 4 = -30' },
    { q: 'What is (-100) ÷ 25 ÷ (-2)?', a: '2', type: 'calculation', difficulty: 2, hint: 'Left to right: (-100) ÷ 25 = -4, then (-4) ÷ (-2) = 2.' },
    { q: 'Explain why division by zero is undefined. Use multiplication to support your reasoning.', a: 'if a ÷ 0 = b then b × 0 = a but anything times 0 is 0 so there is no number b that works when a is not 0 and every number works when a is 0 making it undefined in both cases', type: 'open', difficulty: 3 },
  ]},
  'order-of-operations': { questions: [
    { q: 'What does PEMDAS stand for?', a: 'Parentheses Exponents Multiplication Division Addition Subtraction', type: 'short', difficulty: 1 },
    { q: 'Evaluate: 3 + 4 × 2', a: '11', type: 'calculation', difficulty: 1, rule: 'Multiply before adding: 4 × 2 = 8, then 3 + 8 = 11.' },
    { q: 'True or false: Multiplication always comes before division in the order of operations.', a: 'false', type: 'tf', difficulty: 1, explanation: 'Multiplication and division have equal priority and are performed left to right.' },
    { q: 'Evaluate: (6 + 2) × 3', a: '24', type: 'calculation', difficulty: 1, rule: 'Parentheses first: 8 × 3 = 24.' },
    { q: 'Evaluate: 12 ÷ 3 + 2 × 5', a: '14', type: 'calculation', difficulty: 2, hint: '12 ÷ 3 = 4 and 2 × 5 = 10, then 4 + 10 = 14.' },
    { q: 'Evaluate: 2 + 3^2 × 4', a: '38', type: 'calculation', difficulty: 2, hint: 'Exponent first: 3^2 = 9, then 9 × 4 = 36, then 2 + 36 = 38.' },
    { q: 'Evaluate: (8 - 3)^2 + 6 ÷ 2', a: '28', type: 'calculation', difficulty: 2, hint: 'Parentheses: 5^2 = 25, then 6 ÷ 2 = 3, then 25 + 3 = 28.' },
    { q: 'A student writes 8 - 2 × 3 = 18. Explain the error and find the correct answer.', a: 'the student incorrectly subtracted before multiplying. Correct: multiply first 2 × 3 = 6 then subtract 8 - 6 = 2', type: 'open', difficulty: 3, misconception: 'left-to-right without respecting operation priority' },
  ]},
  'absolute-value': { questions: [
    { q: 'What is the absolute value of -7?', a: '7', type: 'short', difficulty: 1, concept: 'Absolute value is the distance from zero on the number line.' },
    { q: 'What is |5|?', a: '5', type: 'short', difficulty: 1 },
    { q: 'True or false: The absolute value of a number is always positive or zero.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is |-13|?', a: '13', type: 'short', difficulty: 1 },
    { q: 'What is |4 - 9|?', a: '5', type: 'calculation', difficulty: 2, hint: '4 - 9 = -5, and |-5| = 5.' },
    { q: 'Which is greater: |-8| or |6|?', a: '|-8| is greater because |-8| = 8 and |6| = 6', type: 'short', difficulty: 2 },
    { q: 'Solve: |x| = 12. What are the possible values of x?', a: ['x = 12 or x = -12', '12 and -12'], type: 'multi', difficulty: 2 },
    { q: 'Explain why |a - b| gives the distance between two numbers a and b on the number line.', a: 'the absolute value removes the sign so |a - b| gives the positive distance between the two points regardless of which is larger', type: 'open', difficulty: 3 },
  ]},

  // ── fractions ──────────────────────────────────────────────────────────────
  'fraction-basics': { questions: [
    { q: 'What does the numerator of a fraction represent?', a: 'the number of parts you have', type: 'short', difficulty: 1 },
    { q: 'What does the denominator of a fraction represent?', a: 'the total number of equal parts the whole is divided into', type: 'short', difficulty: 1 },
    { q: 'True or false: 3/3 equals 1.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is 0/5?', a: ['0', 'zero'], type: 'multi', difficulty: 1 },
    { q: 'A pizza is cut into 8 equal slices. You eat 3 slices. What fraction of the pizza did you eat?', a: '3/8', type: 'short', difficulty: 1 },
    { q: 'What type of fraction is 7/4?', a: ['improper fraction', 'improper'], type: 'multi', difficulty: 2, concept: 'When the numerator is greater than the denominator, it is an improper fraction.' },
    { q: 'Convert 7/4 to a mixed number.', a: ['1 3/4', '1 and 3/4'], type: 'multi', difficulty: 2 },
    { q: 'Explain why you cannot have a fraction with a denominator of 0.', a: 'division by zero is undefined because you cannot divide something into zero equal parts', type: 'open', difficulty: 3 },
  ]},
  'equivalent-fractions': { questions: [
    { q: 'Are 1/2 and 2/4 equivalent fractions?', a: 'yes', type: 'short', difficulty: 1 },
    { q: 'Find a fraction equivalent to 3/5 with a denominator of 15.', a: '9/15', type: 'short', difficulty: 1, hint: 'Multiply both numerator and denominator by 3.' },
    { q: 'True or false: 4/6 and 2/3 are equivalent fractions.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Simplify 12/18 to lowest terms.', a: '2/3', type: 'short', difficulty: 2, hint: 'Divide both by GCF of 12 and 18, which is 6.' },
    { q: 'Find a fraction equivalent to 5/8 with a denominator of 40.', a: '25/40', type: 'short', difficulty: 2 },
    { q: 'Simplify 36/48 to lowest terms.', a: '3/4', type: 'short', difficulty: 2, hint: 'GCF of 36 and 48 is 12.' },
    { q: 'Is 7/10 equivalent to 21/30?', a: 'yes', type: 'short', difficulty: 2, hint: '7 × 3 = 21 and 10 × 3 = 30.' },
    { q: 'Explain how you can determine whether two fractions are equivalent without finding a common denominator.', a: 'cross multiply and check if the products are equal. For a/b and c/d, they are equivalent if a × d = b × c', type: 'open', difficulty: 3 },
  ]},
  'comparing-fractions': { questions: [
    { q: 'Which is greater: 3/4 or 1/2?', a: '3/4', type: 'short', difficulty: 1 },
    { q: 'Which is greater: 2/5 or 3/5?', a: '3/5', type: 'short', difficulty: 1, rule: 'Same denominator: larger numerator is greater.' },
    { q: 'True or false: 5/8 > 3/4.', a: 'false', type: 'tf', difficulty: 2, hint: '3/4 = 6/8, and 5/8 < 6/8.' },
    { q: 'Order these from least to greatest: 1/3, 1/2, 1/4.', a: ['1/4, 1/3, 1/2', '1/4 1/3 1/2'], type: 'multi', difficulty: 1, rule: 'For unit fractions, larger denominator means smaller value.' },
    { q: 'Which is greater: 5/6 or 7/8?', a: '7/8', type: 'short', difficulty: 2, hint: 'Common denominator 24: 5/6 = 20/24, 7/8 = 21/24.' },
    { q: 'Compare 4/9 and 5/11 using cross multiplication.', a: '4/9 is greater because 4 × 11 = 44 > 5 × 9 = 45 wait actually 44 < 45 so 5/11 is greater', type: 'short', difficulty: 2 },
    { q: 'Is 2/3 greater than or less than 0.6?', a: 'greater than because 2/3 is approximately 0.667', type: 'short', difficulty: 2 },
    { q: 'Explain two different methods for comparing fractions that have different denominators.', a: 'method 1: find a common denominator and compare numerators. Method 2: cross multiply and compare the products. Method 3: convert to decimals and compare.', type: 'open', difficulty: 3 },
  ]},
  'adding-fractions': { questions: [
    { q: 'What is 1/4 + 2/4?', a: '3/4', type: 'short', difficulty: 1, rule: 'Same denominator: add numerators and keep the denominator.' },
    { q: 'What is 1/3 + 1/6?', a: ['1/2', '3/6'], type: 'multi', difficulty: 1, hint: 'Common denominator is 6: 2/6 + 1/6 = 3/6 = 1/2.' },
    { q: 'True or false: 1/2 + 1/3 = 2/5.', a: 'false', type: 'tf', difficulty: 1, misconception: 'You cannot add numerators and denominators separately.' },
    { q: 'What is 2/5 + 1/3?', a: ['11/15'], type: 'multi', difficulty: 2, hint: 'LCD is 15: 6/15 + 5/15 = 11/15.' },
    { q: 'What is 3/8 + 5/12?', a: ['19/24'], type: 'multi', difficulty: 2, hint: 'LCD is 24: 9/24 + 10/24 = 19/24.' },
    { q: 'What is 2 1/3 + 1 1/4?', a: ['3 7/12', '43/12'], type: 'multi', difficulty: 2, hint: 'Add whole numbers: 2 + 1 = 3. Add fractions: 1/3 + 1/4 = 4/12 + 3/12 = 7/12.' },
    { q: 'A recipe calls for 2/3 cup of flour and 3/4 cup of sugar. How much total dry ingredient is needed?', a: ['17/12 cups', '1 5/12 cups'], type: 'multi', difficulty: 2 },
    { q: 'A student adds 1/2 + 1/3 and gets 2/5. Explain the error and show the correct solution.', a: 'the student added both numerators and denominators separately which is incorrect. The correct method is to find a common denominator: 1/2 = 3/6 and 1/3 = 2/6 so 3/6 + 2/6 = 5/6', type: 'open', difficulty: 3 },
  ]},
  'subtracting-fractions': { questions: [
    { q: 'What is 5/8 - 3/8?', a: ['2/8', '1/4'], type: 'multi', difficulty: 1, rule: 'Same denominator: subtract numerators.' },
    { q: 'What is 3/4 - 1/2?', a: '1/4', type: 'short', difficulty: 1, hint: 'Common denominator is 4: 3/4 - 2/4 = 1/4.' },
    { q: 'True or false: 5/6 - 1/3 = 4/3.', a: 'false', type: 'tf', difficulty: 1, explanation: '5/6 - 1/3 = 5/6 - 2/6 = 3/6 = 1/2.' },
    { q: 'What is 7/10 - 2/5?', a: '3/10', type: 'short', difficulty: 2, hint: 'Common denominator is 10: 7/10 - 4/10 = 3/10.' },
    { q: 'What is 5/6 - 3/8?', a: ['11/24'], type: 'multi', difficulty: 2, hint: 'LCD is 24: 20/24 - 9/24 = 11/24.' },
    { q: 'What is 4 1/3 - 2 3/4?', a: ['1 7/12', '19/12'], type: 'multi', difficulty: 2, hint: 'You need to borrow: 4 4/12 - 2 9/12. Borrow 1 from 4: 3 16/12 - 2 9/12 = 1 7/12.' },
    { q: 'A board is 3/4 of a meter long. You cut off 2/5 of a meter. How long is the remaining piece?', a: ['7/20 meter', '7/20 m'], type: 'multi', difficulty: 2, formula: '3/4 - 2/5 = 15/20 - 8/20 = 7/20' },
    { q: 'Explain why you need a common denominator to subtract fractions and what happens if you subtract numerators and denominators separately.', a: 'fractions must have the same denominator so the parts are the same size. Subtracting numerators and denominators separately changes the meaning of the fraction and gives a wrong answer', type: 'open', difficulty: 3 },
  ]},
  'multiplying-fractions': { questions: [
    { q: 'What is 1/2 × 1/3?', a: '1/6', type: 'short', difficulty: 1, rule: 'Multiply numerators together and denominators together.' },
    { q: 'What is 2/3 × 3/4?', a: ['6/12', '1/2'], type: 'multi', difficulty: 1 },
    { q: 'True or false: When you multiply two proper fractions, the result is always smaller than either fraction.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'What is 5/6 × 3/10?', a: ['15/60', '1/4'], type: 'multi', difficulty: 2, hint: 'Simplify before multiplying: 5/6 × 3/10 = (5×3)/(6×10) = 15/60 = 1/4.' },
    { q: 'What is 4 × 2/5?', a: ['8/5', '1 3/5'], type: 'multi', difficulty: 1, hint: 'Write 4 as 4/1, then multiply: 4/1 × 2/5 = 8/5.' },
    { q: 'What is 2 1/2 × 1 1/3?', a: ['10/3', '3 1/3'], type: 'multi', difficulty: 2, hint: 'Convert to improper: 5/2 × 4/3 = 20/6 = 10/3.' },
    { q: 'A garden plot is 3/4 of a yard wide and 2/3 of a yard long. What is the area?', a: ['1/2 square yard', '6/12 square yard'], type: 'multi', difficulty: 2, formula: '3/4 × 2/3 = 6/12 = 1/2' },
    { q: 'Explain why multiplying a number by a fraction less than 1 makes the number smaller. Use an example.', a: 'multiplying by a fraction less than 1 means you are taking a part of the number. For example 12 × 1/3 = 4 because you are taking one third of 12 which is less than 12', type: 'open', difficulty: 3 },
  ]},
  'dividing-fractions': { questions: [
    { q: 'What is the reciprocal of 3/4?', a: '4/3', type: 'short', difficulty: 1 },
    { q: 'What is 1/2 ÷ 1/4?', a: '2', type: 'short', difficulty: 1, rule: 'Multiply by the reciprocal: 1/2 × 4/1 = 4/2 = 2.' },
    { q: 'True or false: Dividing by a fraction is the same as multiplying by its reciprocal.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is 3/5 ÷ 2/3?', a: ['9/10'], type: 'multi', difficulty: 2, hint: '3/5 × 3/2 = 9/10.' },
    { q: 'What is 6 ÷ 1/3?', a: '18', type: 'short', difficulty: 1, hint: '6 × 3/1 = 18. You are asking how many 1/3 pieces fit into 6.' },
    { q: 'What is 2 1/4 ÷ 3/8?', a: '6', type: 'short', difficulty: 2, hint: '9/4 × 8/3 = 72/12 = 6.' },
    { q: 'You have 3/4 of a pound of trail mix to divide equally into bags of 1/8 pound each. How many bags can you fill?', a: '6', type: 'calculation', difficulty: 2, formula: '3/4 ÷ 1/8 = 3/4 × 8/1 = 24/4 = 6' },
    { q: 'Explain why dividing by 1/2 gives the same result as multiplying by 2, using a real-world example.', a: 'dividing by 1/2 asks how many halves fit into the number. For example 3 ÷ 1/2 = 6 because there are 6 halves in 3 whole objects. Multiplying by 2 also gives 6.', type: 'open', difficulty: 3 },
  ]},

  // ── decimals ───────────────────────────────────────────────────────────────
  'decimal-place-value': { questions: [
    { q: 'In the number 3.456, what digit is in the tenths place?', a: '4', type: 'short', difficulty: 1 },
    { q: 'In the number 3.456, what digit is in the hundredths place?', a: '5', type: 'short', difficulty: 1 },
    { q: 'True or false: 0.50 and 0.5 are equal.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Write 7/10 as a decimal.', a: '0.7', type: 'short', difficulty: 1 },
    { q: 'What is the place value of the 8 in 12.083?', a: 'hundredths', type: 'short', difficulty: 2 },
    { q: 'Which is greater: 0.45 or 0.405?', a: '0.45', type: 'short', difficulty: 2, hint: 'Compare tenths first: both have 4. Then hundredths: 5 > 0.' },
    { q: 'Order from least to greatest: 0.7, 0.07, 0.71, 0.701.', a: ['0.07, 0.7, 0.701, 0.71', '0.07 0.7 0.701 0.71'], type: 'multi', difficulty: 2 },
    { q: 'Explain why 0.3 is not equal to 0.03, even though both have a 3 in them.', a: 'in 0.3 the 3 is in the tenths place meaning 3/10 while in 0.03 the 3 is in the hundredths place meaning 3/100 so 0.3 is ten times larger than 0.03', type: 'open', difficulty: 3 },
  ]},
  'decimal-operations': { questions: [
    { q: 'What is 3.5 + 2.7?', a: '6.2', type: 'calculation', difficulty: 1, rule: 'Line up the decimal points and add.' },
    { q: 'What is 5.0 - 1.83?', a: '3.17', type: 'calculation', difficulty: 1 },
    { q: 'True or false: When multiplying decimals, you count total decimal places in both factors.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is 0.6 × 0.4?', a: '0.24', type: 'calculation', difficulty: 1 },
    { q: 'What is 2.5 × 1.2?', a: '3.0', type: 'calculation', difficulty: 2 },
    { q: 'What is 7.2 ÷ 0.9?', a: '8', type: 'calculation', difficulty: 2, hint: 'Move decimal: 72 ÷ 9 = 8.' },
    { q: 'What is 0.36 ÷ 0.04?', a: '9', type: 'calculation', difficulty: 2, hint: 'Move decimal two places: 36 ÷ 4 = 9.' },
    { q: 'A student says 0.3 × 0.2 = 0.6. Explain the error and find the correct answer.', a: 'the student forgot to count decimal places. 0.3 has 1 decimal place and 0.2 has 1 decimal place so the answer needs 2 decimal places. 3 × 2 = 6 so the answer is 0.06', type: 'open', difficulty: 3, misconception: 'forgetting to place the decimal correctly in multiplication' },
  ]},
  'converting-fractions-decimals': { questions: [
    { q: 'Convert 1/4 to a decimal.', a: '0.25', type: 'short', difficulty: 1 },
    { q: 'Convert 0.75 to a fraction in lowest terms.', a: '3/4', type: 'short', difficulty: 1 },
    { q: 'True or false: 1/3 as a decimal is 0.33.', a: 'false', type: 'tf', difficulty: 1, explanation: '1/3 = 0.333... (repeating), not exactly 0.33.' },
    { q: 'Convert 3/8 to a decimal.', a: '0.375', type: 'short', difficulty: 2 },
    { q: 'Convert 0.625 to a fraction in lowest terms.', a: '5/8', type: 'short', difficulty: 2, hint: '0.625 = 625/1000. Divide by GCF 125.' },
    { q: 'Convert 7/20 to a decimal.', a: '0.35', type: 'short', difficulty: 2 },
    { q: 'Which is greater: 5/8 or 0.6?', a: '5/8 because 5/8 = 0.625 which is greater than 0.6', type: 'short', difficulty: 2 },
    { q: 'Explain the process for converting any fraction to a decimal and why this method works.', a: 'divide the numerator by the denominator. This works because a fraction represents division and performing that division gives the decimal equivalent', type: 'open', difficulty: 3 },
  ]},
  'repeating-decimals': { questions: [
    { q: 'What is 1/3 as a decimal?', a: ['0.333...', '0.3 repeating'], type: 'multi', difficulty: 1 },
    { q: 'What is 2/3 as a decimal?', a: ['0.666...', '0.6 repeating'], type: 'multi', difficulty: 1 },
    { q: 'True or false: 0.999... (repeating) equals 1.', a: 'true', type: 'tf', difficulty: 2, explanation: 'Mathematically, 0.999... = 1. This can be shown algebraically.' },
    { q: 'What is 1/6 as a decimal?', a: ['0.1666...', '0.16 repeating'], type: 'multi', difficulty: 2 },
    { q: 'What is 5/11 as a decimal?', a: ['0.4545...', '0.45 repeating'], type: 'multi', difficulty: 2 },
    { q: 'Convert 0.272727... (repeating) to a fraction.', a: ['3/11', '27/99'], type: 'multi', difficulty: 3, hint: 'Let x = 0.272727..., then 100x = 27.2727..., so 99x = 27, x = 27/99 = 3/11.' },
    { q: 'Is 1/7 a terminating or repeating decimal?', a: 'repeating', type: 'short', difficulty: 2, hint: '1/7 = 0.142857142857... with a 6-digit repeating block.' },
    { q: 'Explain how to determine whether a fraction will produce a terminating or repeating decimal without doing the division.', a: 'a fraction in lowest terms produces a terminating decimal only if the denominator has no prime factors other than 2 and 5. If it has any other prime factors it will be a repeating decimal', type: 'open', difficulty: 3 },
  ]},

  // ── exponents-roots ────────────────────────────────────────────────────────
  'exponent-basics': { questions: [
    { q: 'What does 2^5 mean?', a: '2 multiplied by itself 5 times which equals 32', type: 'short', difficulty: 1 },
    { q: 'What is 3^4?', a: '81', type: 'calculation', difficulty: 1, formula: '3 × 3 × 3 × 3 = 81' },
    { q: 'True or false: Any number raised to the power of 0 equals 0.', a: 'false', type: 'tf', difficulty: 1, explanation: 'Any nonzero number raised to the power of 0 equals 1.' },
    { q: 'What is 5^0?', a: '1', type: 'short', difficulty: 1 },
    { q: 'What is 10^4?', a: '10000', type: 'calculation', difficulty: 1 },
    { q: 'What is (-3)^3?', a: '-27', type: 'calculation', difficulty: 2, hint: '(-3) × (-3) × (-3) = 9 × (-3) = -27.' },
    { q: 'What is 2^10?', a: '1024', type: 'calculation', difficulty: 2 },
    { q: 'Explain the difference between (-2)^4 and -2^4.', a: '(-2)^4 = 16 because the negative is inside the parentheses and raised to the power. -2^4 = -16 because only 2 is raised to the fourth power and then the negative sign is applied. The parentheses make a difference.', type: 'open', difficulty: 3 },
  ]},
  'exponent-rules': { questions: [
    { q: 'Simplify: x^3 × x^4', a: 'x^7', type: 'short', difficulty: 1, rule: 'Product rule: add exponents when multiplying same base.' },
    { q: 'Simplify: y^8 ÷ y^3', a: 'y^5', type: 'short', difficulty: 1, rule: 'Quotient rule: subtract exponents when dividing same base.' },
    { q: 'True or false: (a^3)^2 = a^6.', a: 'true', type: 'tf', difficulty: 1, rule: 'Power of a power: multiply the exponents.' },
    { q: 'Simplify: (2x)^3', a: '8x^3', type: 'short', difficulty: 2, hint: '2^3 × x^3 = 8x^3.' },
    { q: 'Simplify: 3^5 × 3^(-2)', a: ['3^3', '27'], type: 'multi', difficulty: 2, hint: '5 + (-2) = 3, so 3^3 = 27.' },
    { q: 'What is 2^(-3)?', a: '1/8', type: 'short', difficulty: 2, rule: 'Negative exponent: a^(-n) = 1/a^n.' },
    { q: 'Simplify: (x^4 × x^2) / x^3', a: 'x^3', type: 'short', difficulty: 2, hint: 'Numerator: x^6. Then x^6 / x^3 = x^3.' },
    { q: 'A student simplifies 2^3 × 3^3 as 6^6. Explain the error and give the correct answer.', a: 'the student incorrectly added the exponents but the bases are different so the product rule does not apply. The correct answer is 2^3 × 3^3 = 8 × 27 = 216 or equivalently (2 × 3)^3 = 6^3 = 216', type: 'open', difficulty: 3 },
  ]},
  'square-roots': { questions: [
    { q: 'What is the square root of 25?', a: '5', type: 'short', difficulty: 1 },
    { q: 'What is √144?', a: '12', type: 'short', difficulty: 1 },
    { q: 'True or false: √49 = 7.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is √81?', a: '9', type: 'short', difficulty: 1 },
    { q: 'Between which two consecutive whole numbers does √50 lie?', a: 'between 7 and 8', type: 'short', difficulty: 2, hint: '7^2 = 49 and 8^2 = 64, so √50 is between 7 and 8.' },
    { q: 'What is √(36/49)?', a: '6/7', type: 'short', difficulty: 2, rule: '√(a/b) = √a / √b' },
    { q: 'Simplify: √72', a: ['6√2', '6 times the square root of 2'], type: 'multi', difficulty: 3, hint: '72 = 36 × 2, and √36 = 6, so √72 = 6√2.' },
    { q: 'Explain why √(-9) is not a real number.', a: 'no real number multiplied by itself gives a negative result because positive × positive = positive and negative × negative = positive so the square root of a negative number is not defined in the real numbers', type: 'open', difficulty: 3 },
  ]},
  'cube-roots': { questions: [
    { q: 'What is the cube root of 8?', a: '2', type: 'short', difficulty: 1, formula: '2 × 2 × 2 = 8' },
    { q: 'What is ∛27?', a: '3', type: 'short', difficulty: 1 },
    { q: 'True or false: The cube root of a negative number is also negative.', a: 'true', type: 'tf', difficulty: 1, explanation: 'Unlike square roots, cube roots of negative numbers are real. (-2)^3 = -8, so ∛(-8) = -2.' },
    { q: 'What is ∛125?', a: '5', type: 'short', difficulty: 1 },
    { q: 'What is ∛(-64)?', a: '-4', type: 'short', difficulty: 2, hint: '(-4) × (-4) × (-4) = -64.' },
    { q: 'What is ∛1000?', a: '10', type: 'short', difficulty: 2 },
    { q: 'Between which two consecutive whole numbers does ∛50 lie?', a: 'between 3 and 4', type: 'short', difficulty: 2, hint: '3^3 = 27 and 4^3 = 64, so ∛50 is between 3 and 4.' },
    { q: 'Explain the key difference between square roots and cube roots when it comes to negative numbers.', a: 'square roots of negative numbers are not real because no real number squared gives a negative. But cube roots of negative numbers are real and negative because a negative number cubed is negative. For example ∛(-8) = -2 is valid but √(-4) is not real.', type: 'open', difficulty: 3 },
  ]},
  'scientific-notation': { questions: [
    { q: 'Write 4,500 in scientific notation.', a: '4.5 × 10^3', type: 'short', difficulty: 1 },
    { q: 'Write 0.003 in scientific notation.', a: '3 × 10^(-3)', type: 'short', difficulty: 1 },
    { q: 'True or false: 5.2 × 10^4 = 52,000.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Convert 6.02 × 10^23 to standard form (first 4 digits).', a: '602000000000000000000000', type: 'short', difficulty: 2, concept: 'Avogadro\'s number' },
    { q: 'Multiply: (3 × 10^4) × (2 × 10^3)', a: '6 × 10^7', type: 'calculation', difficulty: 2, rule: 'Multiply coefficients, add exponents.' },
    { q: 'Divide: (8 × 10^6) ÷ (2 × 10^2)', a: '4 × 10^4', type: 'calculation', difficulty: 2, rule: 'Divide coefficients, subtract exponents.' },
    { q: 'Which is larger: 3.2 × 10^5 or 8.1 × 10^4?', a: '3.2 × 10^5 because 320000 > 81000', type: 'short', difficulty: 2 },
    { q: 'Explain why scientific notation is useful for very large or very small numbers. Give an example of each.', a: 'scientific notation makes extremely large or small numbers easier to read write and compare. For example the distance to the Sun is about 1.5 × 10^8 km instead of 150000000 km and a hydrogen atom diameter is about 1.2 × 10^(-10) m instead of 0.00000000012 m', type: 'open', difficulty: 3 },
  ]},

  // ── number-properties ──────────────────────────────────────────────────────
  'factors-multiples': { questions: [
    { q: 'List all factors of 12.', a: ['1, 2, 3, 4, 6, 12', '1 2 3 4 6 12'], type: 'multi', difficulty: 1 },
    { q: 'List the first five multiples of 7.', a: ['7, 14, 21, 28, 35', '7 14 21 28 35'], type: 'multi', difficulty: 1 },
    { q: 'True or false: Every number is a factor of itself.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Is 8 a factor of 56?', a: 'yes', type: 'short', difficulty: 1, hint: '56 ÷ 8 = 7 with no remainder.' },
    { q: 'Is 72 a multiple of 9?', a: 'yes', type: 'short', difficulty: 1, hint: '72 ÷ 9 = 8.' },
    { q: 'List all factors of 36.', a: ['1, 2, 3, 4, 6, 9, 12, 18, 36', '1 2 3 4 6 9 12 18 36'], type: 'multi', difficulty: 2 },
    { q: 'What is the smallest number that is a multiple of both 6 and 8?', a: '24', type: 'short', difficulty: 2 },
    { q: 'Explain the difference between factors and multiples. How are they related?', a: 'factors are numbers that divide evenly into a given number while multiples are the result of multiplying a number by whole numbers. They are inverses: if 3 is a factor of 12 then 12 is a multiple of 3', type: 'open', difficulty: 3 },
  ]},
  'prime-factorization': { questions: [
    { q: 'What is a prime number?', a: 'a number greater than 1 that has exactly two factors: 1 and itself', type: 'short', difficulty: 1 },
    { q: 'Write the prime factorization of 12.', a: ['2^2 × 3', '2 × 2 × 3'], type: 'multi', difficulty: 1 },
    { q: 'True or false: 1 is a prime number.', a: 'false', type: 'tf', difficulty: 1, explanation: '1 is neither prime nor composite because it has only one factor.' },
    { q: 'Write the prime factorization of 60.', a: ['2^2 × 3 × 5', '2 × 2 × 3 × 5'], type: 'multi', difficulty: 2 },
    { q: 'Is 51 prime or composite?', a: 'composite', type: 'short', difficulty: 2, hint: '51 = 3 × 17.' },
    { q: 'Write the prime factorization of 100.', a: ['2^2 × 5^2', '2 × 2 × 5 × 5'], type: 'multi', difficulty: 2 },
    { q: 'Write the prime factorization of 180.', a: ['2^2 × 3^2 × 5', '2 × 2 × 3 × 3 × 5'], type: 'multi', difficulty: 2 },
    { q: 'Explain why every composite number can be written as a unique product of prime numbers (Fundamental Theorem of Arithmetic).', a: 'every composite number can be broken down into prime factors and this factorization is unique because prime numbers are the building blocks of all integers. No matter how you factor the number you always end up with the same set of primes', type: 'open', difficulty: 3 },
  ]},
  'gcf-lcm': { questions: [
    { q: 'What is the GCF of 12 and 18?', a: '6', type: 'short', difficulty: 1 },
    { q: 'What is the LCM of 4 and 6?', a: '12', type: 'short', difficulty: 1 },
    { q: 'True or false: The GCF of two numbers is always less than or equal to the smaller number.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the GCF of 24 and 36?', a: '12', type: 'short', difficulty: 2, hint: '24 = 2^3 × 3, 36 = 2^2 × 3^2. GCF = 2^2 × 3 = 12.' },
    { q: 'What is the LCM of 8 and 12?', a: '24', type: 'short', difficulty: 2 },
    { q: 'What is the GCF of 45 and 75?', a: '15', type: 'short', difficulty: 2, hint: '45 = 3^2 × 5, 75 = 3 × 5^2. GCF = 3 × 5 = 15.' },
    { q: 'What is the LCM of 15 and 20?', a: '60', type: 'short', difficulty: 2, hint: '15 = 3 × 5, 20 = 2^2 × 5. LCM = 2^2 × 3 × 5 = 60.' },
    { q: 'Hot dogs come in packs of 10 and buns come in packs of 8. What is the least number of each you need so that you have an equal number of hot dogs and buns? Use LCM to solve.', a: 'LCM of 10 and 8 is 40 so you need 4 packs of hot dogs and 5 packs of buns for 40 of each', type: 'open', difficulty: 3 },
  ]},
  'rational-vs-irrational': { questions: [
    { q: 'What is a rational number?', a: 'a number that can be expressed as a fraction of two integers where the denominator is not zero', type: 'short', difficulty: 1 },
    { q: 'Is √2 rational or irrational?', a: 'irrational', type: 'short', difficulty: 1 },
    { q: 'True or false: All fractions are rational numbers.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Is 0.75 rational or irrational?', a: 'rational', type: 'short', difficulty: 1, hint: '0.75 = 3/4.' },
    { q: 'Is π rational or irrational?', a: 'irrational', type: 'short', difficulty: 2 },
    { q: 'Is 0.121212... (repeating) rational or irrational?', a: 'rational', type: 'short', difficulty: 2, hint: 'All repeating decimals are rational because they can be converted to fractions.' },
    { q: 'Classify each number as rational or irrational: √9, √5, -3/7, 0.1010010001...', a: '√9 = 3 is rational, √5 is irrational, -3/7 is rational, 0.1010010001... is irrational because the pattern does not repeat', type: 'short', difficulty: 3 },
    { q: 'Explain why √2 is irrational and describe what makes a decimal expansion irrational versus rational.', a: '√2 is irrational because it cannot be expressed as a ratio of two integers. Its decimal expansion 1.41421356... goes on forever without repeating. A rational number has a decimal that either terminates or repeats while an irrational number has a non-terminating non-repeating decimal', type: 'open', difficulty: 3 },
  ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// HINT BANKS — 3-tier progressive hints per skill
// ═══════════════════════════════════════════════════════════════════════════════

const HINT_BANKS = {
  // integer-operations
  'integer-addition': { tier1: 'Use the number line: start at the first number and move right for positive, left for negative.', tier2: 'Same signs: add absolute values and keep the sign. Different signs: subtract absolute values and keep the sign of the larger.', tier3: 'Example: -5 + (-8) → same sign (negative), add: 5 + 8 = 13, keep negative → -13.' },
  'integer-subtraction': { tier1: 'Subtracting is the same as adding the opposite.', tier2: 'Rewrite a - b as a + (-b). Then use integer addition rules.', tier3: 'Example: -4 - 3 → -4 + (-3) → same sign, add: 4 + 3 = 7, keep negative → -7.' },
  'integer-multiplication': { tier1: 'Remember the sign rules: same signs give positive, different signs give negative.', tier2: 'Positive × Positive = Positive. Negative × Negative = Positive. Positive × Negative = Negative.', tier3: 'Example: (-4) × (-5) = 20 (same signs → positive). 6 × (-3) = -18 (different signs → negative).' },
  'integer-division': { tier1: 'Division follows the same sign rules as multiplication.', tier2: 'Same signs → positive quotient. Different signs → negative quotient.', tier3: 'Example: (-36) ÷ (-9) = 4 (same signs → positive). (-24) ÷ 6 = -4 (different signs → negative).' },
  'order-of-operations': { tier1: 'Remember PEMDAS: Parentheses, Exponents, Multiplication/Division, Addition/Subtraction.', tier2: 'Multiplication and division are equal priority (left to right). Addition and subtraction are equal priority (left to right).', tier3: 'Example: 3 + 4 × 2 = 3 + 8 = 11. NOT (3 + 4) × 2 = 14.' },
  'absolute-value': { tier1: 'Absolute value is always the distance from zero — never negative.', tier2: '|positive| = same number. |negative| = drop the negative sign. |0| = 0.', tier3: 'Example: |-7| = 7, |5| = 5, |4 - 9| = |-5| = 5.' },

  // fractions
  'fraction-basics': { tier1: 'A fraction shows parts of a whole: numerator (top) over denominator (bottom).', tier2: 'The denominator tells you how many equal parts; the numerator tells how many you have.', tier3: 'Example: 3/4 means the whole is divided into 4 equal parts and you have 3 of them.' },
  'equivalent-fractions': { tier1: 'Multiply or divide both numerator and denominator by the same number.', tier2: 'To simplify, divide by the GCF. To find an equivalent, multiply both parts by the same factor.', tier3: 'Example: 2/3 = 4/6 = 6/9 = 8/12. To simplify 12/18: GCF is 6, so 12÷6 / 18÷6 = 2/3.' },
  'comparing-fractions': { tier1: 'Find a common denominator, then compare numerators.', tier2: 'Or cross-multiply: a/b vs c/d → compare a×d with b×c.', tier3: 'Example: 3/4 vs 5/6 → 3×6 = 18, 4×5 = 20. Since 18 < 20, 3/4 < 5/6.' },
  'adding-fractions': { tier1: 'You need a common denominator before you can add.', tier2: 'Find the LCD, rewrite each fraction, then add numerators. Keep the denominator.', tier3: 'Example: 1/3 + 1/4 → LCD = 12 → 4/12 + 3/12 = 7/12.' },
  'subtracting-fractions': { tier1: 'Same rule as addition: common denominator first, then subtract numerators.', tier2: 'Find the LCD, convert, subtract numerators, simplify if needed.', tier3: 'Example: 5/6 - 1/4 → LCD = 12 → 10/12 - 3/12 = 7/12.' },
  'multiplying-fractions': { tier1: 'Multiply straight across: numerator × numerator, denominator × denominator.', tier2: 'You can simplify before multiplying by canceling common factors diagonally.', tier3: 'Example: 2/3 × 3/4 → cancel the 3s → 2/1 × 1/4 = 2/4 = 1/2.' },
  'dividing-fractions': { tier1: 'Keep the first fraction, change division to multiplication, flip the second fraction.', tier2: 'Keep-Change-Flip: a/b ÷ c/d = a/b × d/c.', tier3: 'Example: 3/5 ÷ 2/3 → 3/5 × 3/2 = 9/10.' },

  // decimals
  'decimal-place-value': { tier1: 'Places after the decimal: tenths, hundredths, thousandths (each 10× smaller).', tier2: 'Compare decimals digit by digit from left to right, same as whole numbers.', tier3: 'Example: 0.45 vs 0.405 → tenths: both 4. Hundredths: 5 vs 0. So 0.45 > 0.405.' },
  'decimal-operations': { tier1: 'For +/−: line up decimal points. For ×: count total decimal places. For ÷: move decimals.', tier2: 'Multiplication: multiply as whole numbers, then place the decimal (total places from both factors).', tier3: 'Example: 0.6 × 0.4 → 6 × 4 = 24 → 2 decimal places → 0.24.' },
  'converting-fractions-decimals': { tier1: 'Fraction to decimal: divide numerator by denominator.', tier2: 'Decimal to fraction: put digits over the appropriate power of 10, then simplify.', tier3: 'Example: 3/8 → 3 ÷ 8 = 0.375. And 0.75 → 75/100 → 3/4.' },
  'repeating-decimals': { tier1: 'A repeating decimal has a digit or block that repeats forever.', tier2: 'To convert to a fraction: let x = the decimal, multiply to shift, subtract to eliminate repeating part.', tier3: 'Example: x = 0.333... → 10x = 3.333... → 10x - x = 3 → 9x = 3 → x = 1/3.' },

  // exponents-roots
  'exponent-basics': { tier1: 'An exponent tells you how many times to multiply the base by itself.', tier2: 'a^n = a × a × ... × a (n times). Any nonzero number to the 0 power equals 1.', tier3: 'Example: 2^5 = 2 × 2 × 2 × 2 × 2 = 32. And 7^0 = 1.' },
  'exponent-rules': { tier1: 'Product rule: same base → add exponents. Quotient rule: same base → subtract exponents.', tier2: 'Power rule: (a^m)^n = a^(m×n). Negative exponent: a^(-n) = 1/a^n.', tier3: 'Example: x^3 × x^4 = x^7. (x^3)^2 = x^6. 2^(-3) = 1/2^3 = 1/8.' },
  'square-roots': { tier1: '√a asks: what number times itself equals a?', tier2: 'Perfect squares: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.', tier3: 'Example: √64 = 8 because 8 × 8 = 64. √50 is between 7 (49) and 8 (64).' },
  'cube-roots': { tier1: '∛a asks: what number cubed equals a? Cube roots CAN be negative.', tier2: 'Perfect cubes: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000.', tier3: 'Example: ∛(-64) = -4 because (-4)³ = -64.' },
  'scientific-notation': { tier1: 'Scientific notation: a number between 1 and 10 multiplied by a power of 10.', tier2: 'Large numbers → positive exponent. Small numbers (< 1) → negative exponent.', tier3: 'Example: 4500 = 4.5 × 10^3. And 0.003 = 3 × 10^(-3).' },

  // number-properties
  'factors-multiples': { tier1: 'Factors divide evenly into a number. Multiples are found by multiplying.', tier2: 'To find all factors, check from 1 up to √n. For multiples, keep multiplying: n×1, n×2, n×3...', tier3: 'Example: Factors of 12: 1, 2, 3, 4, 6, 12. Multiples of 7: 7, 14, 21, 28, 35...' },
  'prime-factorization': { tier1: 'Break a number into a product of only prime numbers.', tier2: 'Use a factor tree: split into two factors, then keep splitting until all are prime.', tier3: 'Example: 60 → 2 × 30 → 2 × 2 × 15 → 2 × 2 × 3 × 5 = 2² × 3 × 5.' },
  'gcf-lcm': { tier1: 'GCF: greatest common factor (largest shared factor). LCM: least common multiple (smallest shared multiple).', tier2: 'Use prime factorizations. GCF = product of shared primes with smallest powers. LCM = product of all primes with largest powers.', tier3: 'Example: 12 = 2² × 3, 18 = 2 × 3². GCF = 2 × 3 = 6. LCM = 2² × 3² = 36.' },
  'rational-vs-irrational': { tier1: 'Rational = can be written as a fraction. Irrational = cannot.', tier2: 'Terminating and repeating decimals are rational. Non-terminating, non-repeating decimals are irrational.', tier3: 'Example: 0.75 = 3/4 (rational). π = 3.14159... (irrational). √4 = 2 (rational). √2 = 1.4142... (irrational).' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MISCONCEPTIONS — pattern-matched corrections per skill
// ═══════════════════════════════════════════════════════════════════════════════

const MISCONCEPTIONS = {
  'integer-addition': [
    { patterns: [/negative.*plus.*negative.*positive|two negatives.*make.*positive/i], correction: 'Two negatives do NOT make a positive when ADDING. -5 + (-3) = -8, not +8. The "two negatives make a positive" rule only applies to MULTIPLICATION and DIVISION.' },
  ],
  'integer-subtraction': [
    { patterns: [/can.*not.*subtract.*larger|cannot.*subtract.*bigger|impossible/i], correction: 'You CAN subtract a larger number from a smaller one — the result is simply negative. 5 - 8 = -3. The number line extends in both directions.' },
  ],
  'integer-multiplication': [
    { patterns: [/negative.*times.*negative.*negative|two neg.*give.*neg/i], correction: 'Negative × negative = POSITIVE, not negative. Think of it as reversing a reversal. (-3) × (-4) = +12.' },
  ],
  'integer-division': [
    { patterns: [/divide.*by.*zero.*equals.*zero|anything.*divided.*zero.*is.*zero/i], correction: 'Division by zero is UNDEFINED, not zero. You cannot divide something into zero groups. Even 0 ÷ 0 is undefined (indeterminate).' },
  ],
  'order-of-operations': [
    { patterns: [/left.*to.*right|add.*before.*multiply|subtract.*first/i], correction: 'You do NOT simply go left to right. PEMDAS says: Parentheses first, then Exponents, then Multiplication/Division (left to right), then Addition/Subtraction (left to right). 3 + 4 × 2 = 11, NOT 14.' },
  ],
  'absolute-value': [
    { patterns: [/absolute.*value.*negative|absolute.*can.*be.*negative/i], correction: 'Absolute value is NEVER negative. It represents distance from zero on the number line, and distance is always non-negative. |-7| = 7, not -7.' },
  ],
  'fraction-basics': [
    { patterns: [/bigger.*denominator.*bigger.*fraction|larger.*bottom.*larger/i], correction: 'A bigger denominator does NOT make a bigger fraction. It means the whole is cut into MORE pieces, so each piece is SMALLER. 1/8 < 1/4 because eighths are smaller than quarters.' },
  ],
  'adding-fractions': [
    { patterns: [/add.*top.*add.*bottom|add.*numerator.*add.*denominator|1\/2.*plus.*1\/3.*=.*2\/5/i], correction: 'You CANNOT add numerators and denominators separately. 1/2 + 1/3 ≠ 2/5. You must find a common denominator first: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.' },
  ],
  'multiplying-fractions': [
    { patterns: [/need.*common.*denominator.*multiply|same.*denominator.*multiply/i], correction: 'You do NOT need a common denominator for multiplication. Just multiply straight across: numerator × numerator and denominator × denominator. Common denominators are only needed for addition and subtraction.' },
  ],
  'dividing-fractions': [
    { patterns: [/divide.*straight.*across|divide.*numerator.*denominator.*separately/i], correction: 'You do NOT divide fractions straight across. Use Keep-Change-Flip: keep the first fraction, change ÷ to ×, then flip (reciprocal) the second fraction. Then multiply.' },
  ],
  'decimal-operations': [
    { patterns: [/0\.3.*times.*0\.2.*=.*0\.6|multiply.*decimal.*same/i], correction: 'When multiplying decimals, count the TOTAL decimal places in both factors. 0.3 (1 place) × 0.2 (1 place) = 0.06 (2 places), NOT 0.6. Multiply as whole numbers (3 × 2 = 6) then place the decimal.' },
  ],
  'exponent-basics': [
    { patterns: [/exponent.*means.*multiply.*by|2\^5.*=.*10|times.*the.*exponent/i], correction: 'An exponent does NOT mean multiply the base by the exponent. 2^5 ≠ 2 × 5 = 10. It means multiply the base by ITSELF that many times: 2^5 = 2 × 2 × 2 × 2 × 2 = 32.' },
  ],
  'exponent-rules': [
    { patterns: [/add.*base.*multiply|multiply.*bases.*add.*exponents|2\^3.*times.*3\^3.*=.*6\^6/i], correction: 'The product rule (add exponents) only works with the SAME base. 2^3 × 3^3 ≠ 6^6. Instead, 2^3 × 3^3 = 8 × 27 = 216 = 6^3. You can use (a×b)^n = a^n × b^n, but NOT a^m × b^n = (ab)^(m+n).' },
  ],
  'square-roots': [
    { patterns: [/square root.*half|√16.*=.*8|divide.*by.*2/i], correction: 'The square root is NOT half the number. √16 = 4, not 8. The square root asks: what number multiplied by ITSELF equals 16? Since 4 × 4 = 16, √16 = 4.' },
  ],
  'scientific-notation': [
    { patterns: [/count.*zeros|number.*of.*zeros.*exponent/i], correction: 'The exponent in scientific notation is NOT simply the number of zeros. It is how many places you move the decimal point. 4500 = 4.5 × 10^3 (decimal moved 3 places, not 2 zeros). Always express as a number between 1 and 10 times a power of 10.' },
  ],
  'prime-factorization': [
    { patterns: [/1.*is.*prime|one.*prime/i], correction: '1 is NOT a prime number. A prime number must have exactly two distinct factors: 1 and itself. The number 1 has only one factor (itself), so it is neither prime nor composite.' },
  ],
  'rational-vs-irrational': [
    { patterns: [/all.*decimals.*rational|decimal.*always.*rational|only.*fractions.*rational/i], correction: 'Not all decimals are rational. A decimal is rational only if it terminates or repeats. Non-terminating, non-repeating decimals like π = 3.14159... and √2 = 1.41421... are irrational.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHENOMENA — driving questions for phenomenon-based learning
// ═══════════════════════════════════════════════════════════════════════════════

const PHENOMENA = {
  'integer-operations': [
    { title: 'Temperature Extremes', focus: 'integer addition, subtraction, negative numbers', text: 'In Yakutsk, Russia, the average January temperature is -40°C and the average July temperature is 19°C. Death Valley, California once recorded 56.7°C. Antarctica recorded -89.2°C.', drivingQuestion: 'What is the temperature difference between the hottest and coldest places on Earth? If the temperature in Yakutsk rises 5°C per month from January, what month does it first go above 0°C?' },
    { title: 'Bank Account Balance', focus: 'integer operations, negative numbers', text: 'A student has $125 in their account. They make purchases of $43, $67, and $31. Then they receive a payment of $50.', drivingQuestion: 'Write an integer expression for the account balance after all transactions. Can the account go negative (overdraft)? Model this on a number line.' },
  ],
  'fractions': [
    { title: 'Pizza Party Planning', focus: 'fractions, operations', text: 'A class of 28 students orders pizza. Each pizza has 8 slices. Some students eat 2 slices and others eat 3. The teacher says they ate 7 3/4 pizzas total.', drivingQuestion: 'How many slices were eaten? If 3/4 of the students ate 2 slices each, and the rest ate 3 slices each, does the teacher\'s count match? Express each student group\'s consumption as a fraction of total pizza.' },
    { title: 'Music and Fractions', focus: 'fractions, equivalent fractions', text: 'In music, a whole note lasts 4 beats. A half note lasts 2 beats. A quarter note lasts 1 beat. An eighth note lasts 1/2 beat. A sixteenth note lasts 1/4 beat.', drivingQuestion: 'How many eighth notes fit in a whole note? If a measure has 4 beats, find three different combinations of notes that fill exactly one measure. Express each combination using fraction addition.' },
  ],
  'decimals': [
    { title: 'Olympic Timing', focus: 'decimal operations, place value', text: 'In the 100m sprint, the difference between gold and silver is often less than 0.1 seconds. Usain Bolt\'s record is 9.58 seconds. The second-fastest time ever is 9.69 seconds.', drivingQuestion: 'What is the difference between these times? If each stride covers about 2.44 meters, how many strides does a sprinter take? Why do we need to measure to the hundredths place in racing?' },
  ],
  'exponents-roots': [
    { title: 'Viral Social Media Post', focus: 'exponents, exponential growth', text: 'A social media post is shared by 3 people. Each of those 3 people shares it with 3 more people, and so on. After 1 round, 3 people have seen it. After 2 rounds, 9 new people see it.', drivingQuestion: 'Write an expression using exponents for the number of new viewers after n rounds. How many rounds until over 1 million new people see the post in a single round? What does 3^0 represent in this context?' },
  ],
  'number-properties': [
    { title: 'Cicada Life Cycles', focus: 'prime numbers, LCM', text: 'Periodical cicadas emerge in cycles of 13 or 17 years. These are both prime numbers. Scientists believe the prime-number cycles help cicadas avoid predators that have shorter, regular cycles.', drivingQuestion: 'If a predator has a 4-year cycle, how often would it coincide with a 12-year cicada vs. a 13-year cicada? Use LCM to find when 13-year and 17-year cicada broods would emerge in the same year.' },
    { title: 'The Golden Ratio and Irrationals', focus: 'irrational numbers, square roots', text: 'The golden ratio φ = (1 + √5)/2 ≈ 1.618... appears in sunflower spirals, shell curves, and famous art like the Parthenon. It is an irrational number.', drivingQuestion: 'Why is the golden ratio irrational? Can you find the first 5 decimal places? How does the presence of √5 make the entire expression irrational?' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL LABS
// ═══════════════════════════════════════════════════════════════════════════════

const VIRTUAL_LABS = {
  'fraction-addition-visual': {
    title: 'Virtual Fraction Addition Lab',
    skills: ['adding-fractions', 'equivalent-fractions', 'fraction-basics'],
    objective: 'Visualize fraction addition using area models and number lines',
    background: 'Adding fractions requires a common denominator so that the parts are the same size. Area models show why: you cannot add pieces of different sizes without first making them the same.',
    hypothesis_prompt: 'Predict: Is 1/2 + 1/3 equal to, greater than, or less than 1? Draw a picture to support your prediction.',
    variables: { independent: 'fractions to add', dependent: 'sum, visual area', controlled: ['model type (area model)', 'whole size'] },
    procedure: [
      { step: 1, action: 'Use the area model to shade 1/2 of a rectangle. Then shade 1/3 of an identical rectangle.' },
      { step: 2, action: 'Divide both rectangles into sixths (common denominator). Count how many sixths are shaded in each.' },
      { step: 3, action: 'Combine the shaded parts onto one rectangle. What fraction is the total?' },
      { step: 4, action: 'Repeat for 2/3 + 3/4 and 1/4 + 2/5.' },
      { step: 5, action: 'Compare the visual results with the calculated results using LCD.' },
    ],
    observations: {
      'half-plus-third': '1/2 = 3/6, 1/3 = 2/6. Combined: 3/6 + 2/6 = 5/6. The area model shows 5 out of 6 equal sections shaded.',
      'two-thirds-plus-three-fourths': '2/3 = 8/12, 3/4 = 9/12. Combined: 17/12 = 1 5/12. More than one whole rectangle is shaded.',
      'quarter-plus-two-fifths': '1/4 = 5/20, 2/5 = 8/20. Combined: 13/20. Less than one whole.',
    },
    data_table: {
      columns: ['Fraction 1', 'Fraction 2', 'LCD', 'Converted', 'Sum', 'Simplified'],
      rows: [
        ['1/2', '1/3', '6', '3/6 + 2/6', '5/6', '5/6'],
        ['2/3', '3/4', '12', '8/12 + 9/12', '17/12', '1 5/12'],
        ['1/4', '2/5', '20', '5/20 + 8/20', '13/20', '13/20'],
      ],
    },
    conclusion_questions: [
      'Why is finding a common denominator necessary before adding fractions?',
      'Can the sum of two proper fractions be improper? Give an example from the lab.',
      'Why does 1/2 + 1/3 ≠ 2/5? Use the area model to explain.',
      'Predict: 3/4 + 5/6. Find the LCD and solve.',
      'How does the area model help you see the error in adding numerators and denominators?',
    ],
  },
  'integer-number-line': {
    title: 'Virtual Integer Operations on the Number Line',
    skills: ['integer-addition', 'integer-subtraction', 'absolute-value'],
    objective: 'Model integer addition and subtraction using a number line applet',
    background: 'The number line is a powerful tool for visualizing integer operations. Addition moves right (positive) or left (negative). Subtraction can be thought of as adding the opposite.',
    hypothesis_prompt: 'Predict: Starting at -3, if you add -5, where do you end up? What about -3 - (-5)?',
    variables: { independent: 'starting number, operation, second number', dependent: 'final position on number line', controlled: ['number line scale', 'step size'] },
    procedure: [
      { step: 1, action: 'Start at 0. Model 7 + (-3) by moving 7 right, then 3 left. Record final position.' },
      { step: 2, action: 'Start at 0. Model -5 + (-8) by moving 5 left, then 8 more left. Record final position.' },
      { step: 3, action: 'Model 4 - 9 as 4 + (-9). Record the result.' },
      { step: 4, action: 'Model -3 - (-7) as -3 + 7. Record the result.' },
      { step: 5, action: 'For each result, find its absolute value (distance from zero).' },
    ],
    observations: {
      'seven-plus-neg-three': 'Start at 0, move to 7, then back 3. Land on 4. |4| = 4.',
      'neg-five-plus-neg-eight': 'Start at 0, move to -5, then 8 more left. Land on -13. |-13| = 13.',
      'four-minus-nine': 'Rewrite as 4 + (-9). Start at 4, move 9 left. Land on -5. |-5| = 5.',
      'neg-three-minus-neg-seven': 'Rewrite as -3 + 7. Start at -3, move 7 right. Land on 4. |4| = 4.',
    },
    data_table: {
      columns: ['Expression', 'Rewritten', 'Start', 'Move', 'Result', 'Absolute Value'],
      rows: [
        ['7 + (-3)', '7 + (-3)', '0', '+7, then -3', '4', '4'],
        ['-5 + (-8)', '-5 + (-8)', '0', '-5, then -8', '-13', '13'],
        ['4 - 9', '4 + (-9)', '0', '+4, then -9', '-5', '5'],
        ['-3 - (-7)', '-3 + 7', '0', '-3, then +7', '4', '4'],
      ],
    },
    conclusion_questions: [
      'When adding a negative number, which direction do you move on the number line?',
      'How does the number line show that subtracting a negative is the same as adding a positive?',
      'What is the relationship between the direction of the move and the sign of the number being added?',
      'If you start at any number and add its opposite, where do you always end up? Why?',
      'Create your own integer addition problem and model it on a number line.',
    ],
  },
  'exponent-growth-patterns': {
    title: 'Virtual Exponent Growth Patterns Lab',
    skills: ['exponent-basics', 'exponent-rules', 'scientific-notation'],
    objective: 'Investigate patterns in powers and discover exponent rules through experimentation',
    background: 'Exponents describe repeated multiplication. When we multiply or divide powers with the same base, patterns emerge in the exponents.',
    hypothesis_prompt: 'Predict: If 2^3 = 8 and 2^4 = 16, what is 2^3 × 2^4? How does it relate to other powers of 2?',
    variables: { independent: 'base, exponent', dependent: 'value, pattern in exponents', controlled: ['using same base for each experiment'] },
    procedure: [
      { step: 1, action: 'Calculate 2^1 through 2^10. Record all values.' },
      { step: 2, action: 'Multiply: 2^2 × 2^3, 2^3 × 2^4, 2^1 × 2^5. Find each product in your table.' },
      { step: 3, action: 'Divide: 2^7 ÷ 2^3, 2^6 ÷ 2^2, 2^10 ÷ 2^4. Find each quotient in your table.' },
      { step: 4, action: 'Calculate: (2^3)^2, (2^2)^3. Find each result in your table.' },
      { step: 5, action: 'Based on your results, write the three exponent rules you discovered.' },
    ],
    observations: {
      'powers-of-2': '2^1=2, 2^2=4, 2^3=8, 2^4=16, 2^5=32, 2^6=64, 2^7=128, 2^8=256, 2^9=512, 2^10=1024.',
      'product-rule': '2^2 × 2^3 = 4 × 8 = 32 = 2^5 (exponents add: 2+3=5). 2^3 × 2^4 = 8 × 16 = 128 = 2^7 (3+4=7). Pattern: add exponents!',
      'quotient-rule': '2^7 ÷ 2^3 = 128 ÷ 8 = 16 = 2^4 (exponents subtract: 7-3=4). Pattern: subtract exponents!',
      'power-rule': '(2^3)^2 = 8^2 = 64 = 2^6 (exponents multiply: 3×2=6). (2^2)^3 = 4^3 = 64 = 2^6 (2×3=6). Pattern: multiply exponents!',
    },
    data_table: {
      columns: ['Expression', 'Calculated Value', 'Equivalent Power of 2', 'Rule Used'],
      rows: [
        ['2^2 × 2^3', '32', '2^5', 'Product (add exponents)'],
        ['2^3 × 2^4', '128', '2^7', 'Product (add exponents)'],
        ['2^7 ÷ 2^3', '16', '2^4', 'Quotient (subtract exponents)'],
        ['2^6 ÷ 2^2', '16', '2^4', 'Quotient (subtract exponents)'],
        ['(2^3)^2', '64', '2^6', 'Power (multiply exponents)'],
        ['(2^2)^3', '64', '2^6', 'Power (multiply exponents)'],
      ],
    },
    conclusion_questions: [
      'State the product rule for exponents in your own words.',
      'State the quotient rule for exponents in your own words.',
      'State the power rule for exponents in your own words.',
      'Using the quotient rule, what is 2^3 ÷ 2^3? What does this tell you about 2^0?',
      'Using the product rule, what is 2^3 × 2^(-3)? What does this tell you about negative exponents?',
    ],
  },
  'gcf-lcm-exploration': {
    title: 'Virtual GCF and LCM Exploration Lab',
    skills: ['gcf-lcm', 'prime-factorization', 'factors-multiples'],
    objective: 'Discover GCF and LCM using Venn diagrams of prime factorizations',
    background: 'The GCF is the product of all shared prime factors. The LCM is the product of all prime factors from both numbers (using the highest power of each).',
    hypothesis_prompt: 'Predict: For 12 and 18, which will be larger — the GCF or the LCM? Will GCF × LCM have any relationship to 12 × 18?',
    variables: { independent: 'pair of numbers', dependent: 'GCF, LCM', controlled: ['method (prime factorization)', 'Venn diagram format'] },
    procedure: [
      { step: 1, action: 'Find the prime factorization of 12 and 18.' },
      { step: 2, action: 'Place shared prime factors in the overlap of a Venn diagram. Place unique factors in the outer sections.' },
      { step: 3, action: 'GCF = product of overlap. LCM = product of all sections combined.' },
      { step: 4, action: 'Repeat for pairs: (24, 36), (15, 20), (7, 11).' },
      { step: 5, action: 'For each pair, check if GCF × LCM = product of the two original numbers.' },
    ],
    observations: {
      '12-and-18': '12 = 2² × 3, 18 = 2 × 3². Shared: 2 × 3. Unique to 12: extra 2. Unique to 18: extra 3. GCF = 2 × 3 = 6. LCM = 2² × 3² = 36. Check: 6 × 36 = 216 = 12 × 18. ✓',
      '24-and-36': '24 = 2³ × 3, 36 = 2² × 3². GCF = 2² × 3 = 12. LCM = 2³ × 3² = 72. Check: 12 × 72 = 864 = 24 × 36. ✓',
      '15-and-20': '15 = 3 × 5, 20 = 2² × 5. GCF = 5. LCM = 2² × 3 × 5 = 60. Check: 5 × 60 = 300 = 15 × 20. ✓',
      '7-and-11': 'Both prime, no shared factors. GCF = 1. LCM = 7 × 11 = 77. Check: 1 × 77 = 77 = 7 × 11. ✓',
    },
    data_table: {
      columns: ['Pair', 'GCF', 'LCM', 'GCF × LCM', 'Product', 'Match?'],
      rows: [
        ['12, 18', '6', '36', '216', '216', 'Yes'],
        ['24, 36', '12', '72', '864', '864', 'Yes'],
        ['15, 20', '5', '60', '300', '300', 'Yes'],
        ['7, 11', '1', '77', '77', '77', 'Yes'],
      ],
    },
    conclusion_questions: [
      'Is it always true that GCF × LCM = product of the two numbers? Why?',
      'What is the GCF of two prime numbers? What is their LCM?',
      'If two numbers share no common factors (are coprime), what is their GCF?',
      'How does the Venn diagram method relate to the listing-factors method?',
      'Find the GCF and LCM of 30 and 45 using the Venn diagram method.',
    ],
  },
  'decimal-operations-estimation': {
    title: 'Virtual Decimal Operations and Estimation Lab',
    skills: ['decimal-operations', 'decimal-place-value', 'converting-fractions-decimals'],
    objective: 'Practice decimal operations using estimation to check reasonableness',
    background: 'Estimation is a powerful tool for checking decimal calculations. By rounding to friendly numbers, you can quickly tell if your answer is in the right ballpark.',
    hypothesis_prompt: 'Predict: Is 4.7 × 3.2 closer to 12, 15, or 20? How did you estimate?',
    variables: { independent: 'decimal expressions', dependent: 'exact answer, estimated answer', controlled: ['estimation method (rounding)'] },
    procedure: [
      { step: 1, action: 'Estimate 4.7 × 3.2 by rounding each to the nearest whole number. Then calculate exactly.' },
      { step: 2, action: 'Estimate 12.6 ÷ 0.42 by rounding. Then calculate exactly.' },
      { step: 3, action: 'Estimate 7.89 + 3.14 + 2.06. Then calculate exactly.' },
      { step: 4, action: 'Calculate 0.15 × 0.3. Estimate first, then find exact.' },
      { step: 5, action: 'For each, compare estimate to exact. How close were you?' },
    ],
    observations: {
      'multiply-4.7-3.2': 'Estimate: 5 × 3 = 15. Exact: 4.7 × 3.2 = 15.04. Very close!',
      'divide-12.6-0.42': 'Estimate: 12 ÷ 0.4 = 30. Exact: 12.6 ÷ 0.42 = 30. Exact match!',
      'add-three-decimals': 'Estimate: 8 + 3 + 2 = 13. Exact: 7.89 + 3.14 + 2.06 = 13.09. Very close!',
      'multiply-small-decimals': 'Estimate: 0.2 × 0.3 = 0.06. Exact: 0.15 × 0.3 = 0.045. Estimate was in the right range.',
    },
    data_table: {
      columns: ['Expression', 'Estimate', 'Exact', 'Difference', 'Reasonable?'],
      rows: [
        ['4.7 × 3.2', '15', '15.04', '0.04', 'Yes'],
        ['12.6 ÷ 0.42', '30', '30', '0', 'Yes'],
        ['7.89 + 3.14 + 2.06', '13', '13.09', '0.09', 'Yes'],
        ['0.15 × 0.3', '0.06', '0.045', '0.015', 'Yes'],
      ],
    },
    conclusion_questions: [
      'Why is estimation useful when working with decimals?',
      'When multiplying two decimals less than 1, is the product greater or less than either factor?',
      'When dividing by a decimal less than 1, is the quotient greater or less than the dividend?',
      'A student calculates 3.5 × 2.8 = 98. Use estimation to show this is unreasonable.',
      'Convert 3/8 and 5/6 to decimals, then add them. Estimate first.',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGRAMS — ASCII diagrams for key concepts
// ═══════════════════════════════════════════════════════════════════════════════

const DIAGRAMS_LOCAL = {
  'number-line-integers': {
    domain: 'ms-math-numbers',
    skill: 'integer-addition',
    topic: 'Integer Number Line',
    description: 'A number line showing positive and negative integers with labeled points.',
    diagram: `
  ←──+──+──+──+──+──+──+──+──+──+──+──+──→
    -6 -5 -4 -3 -2 -1  0  1  2  3  4  5  6

  Point [A] is at -4.
  Point [B] is at 2.

  Distance from [A] to [B]: ___
  |A| = ___
  |B| = ___
  A + B = ___
`,
    labels: { 'Distance from A to B': '6', '|A|': '4', '|B|': '2', 'A + B': '-2' },
  },
  'fraction-area-model': {
    domain: 'ms-math-numbers',
    skill: 'adding-fractions',
    topic: 'Fraction Addition Area Model',
    description: 'Two rectangles showing fraction addition with area models.',
    diagram: `
  Rectangle 1 (divided into 4):       Rectangle 2 (divided into 3):
  +------+------+------+------+       +--------+--------+--------+
  |XXXXX |XXXXX |XXXXX |      |       |XXXXXXX |XXXXXXX |        |
  |XXXXX |XXXXX |XXXXX |      |       |XXXXXXX |XXXXXXX |        |
  +------+------+------+------+       +--------+--------+--------+
      [A] = ___                           [B] = ___

  To add [A] + [B], find LCD = ___

  Combined (divided into [C] equal parts):
  +----+----+----+----+----+----+----+----+----+----+----+----+
  | XX | XX | XX | XX | XX | XX | XX | XX | XX | XX | XX |    |
  +----+----+----+----+----+----+----+----+----+----+----+----+

  [A] + [B] = ___/12 = ___
`,
    labels: { A: '3/4', B: '2/3', C: '12', 'A + B': '17/12 or 1 5/12' },
  },
  'decimal-place-value-chart': {
    domain: 'ms-math-numbers',
    skill: 'decimal-place-value',
    topic: 'Decimal Place Value Chart',
    description: 'A place value chart showing the position of each digit in a decimal number.',
    diagram: `
  Number: 4 5 . 0 8 3

  +----------+-------+---+--------+-----------+------------+
  |   [A]    |  [B]  | . |  [C]   |    [D]    |    [E]     |
  |    4     |   5   | . |   0    |     8     |     3      |
  +----------+-------+---+--------+-----------+------------+

  [A] place name: _______________
  [B] place name: _______________
  [C] place name: _______________
  [D] place name: _______________
  [E] place name: _______________
  Value of digit 8: ___
`,
    labels: { A: 'tens', B: 'ones', C: 'tenths', D: 'hundredths', E: 'thousandths', 'Value of digit 8': '0.08' },
  },
  'exponent-pattern': {
    domain: 'ms-math-numbers',
    skill: 'exponent-basics',
    topic: 'Powers of 2 Pattern',
    description: 'A table showing powers of 2 to discover patterns in exponents.',
    diagram: `
  2^5 = [A]
  2^4 = [B]
  2^3 = [C]
  2^2 = [D]
  2^1 = [E]
  2^0 = [F]

  Pattern: each row is ___ the row above.
  Following the pattern, 2^0 = ___
  What is 2^(-1)? (continue the pattern) ___
`,
    labels: { A: '32', B: '16', C: '8', D: '4', E: '2', F: '1', 'Pattern': 'half', '2^(-1)': '1/2' },
  },
  'prime-factor-tree': {
    domain: 'ms-math-numbers',
    skill: 'prime-factorization',
    topic: 'Factor Tree for 60',
    description: 'A factor tree breaking 60 into its prime factors.',
    diagram: `
             60
            /  \\
          [A]   [B]
          / \\
        [C]  [D]
              / \\
            [E]  [F]

  [A] = ___  (a factor of 60)
  [B] = ___  (the other factor)
  [C] = ___  (prime factor)
  [D] = ___
  [E] = ___  (prime factor)
  [F] = ___  (prime factor)

  Prime factorization: 60 = ___ × ___ × ___ × ___
`,
    labels: { A: '6', B: '10', C: '2', D: '3', E: '2', F: '5', 'Prime factorization': '2 × 2 × 3 × 5' },
  },
  'gcf-lcm-venn': {
    domain: 'ms-math-numbers',
    skill: 'gcf-lcm',
    topic: 'GCF and LCM Using Venn Diagram',
    description: 'A Venn diagram of prime factors for 12 and 18.',
    diagram: `
  12 = 2² × 3          18 = 2 × 3²

        12 only     Both     18 only
       +--------+---------+---------+
       |        |         |         |
       |  [A]   |  [B]    |  [C]    |
       |        |         |         |
       +--------+---------+---------+

  [A] (prime factors unique to 12): ___
  [B] (prime factors shared): ___
  [C] (prime factors unique to 18): ___

  GCF = product of [B] = ___
  LCM = product of [A] × [B] × [C] = ___
`,
    labels: { A: '2', B: '2 × 3', C: '3', 'GCF': '6', 'LCM': '36' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CER PHENOMENA — Claim-Evidence-Reasoning writing prompts
// ═══════════════════════════════════════════════════════════════════════════════

const CER_PHENOMENA_LOCAL = {
  'repeating-decimals-fractions': {
    domain: 'ms-math-numbers',
    title: 'Does 0.999... = 1?',
    phenomenon: 'Many students are surprised to learn that 0.999... (with 9s repeating forever) is mathematically equal to 1. This is not an approximation — they are the exact same number.',
    scaffold: {
      claim: 'Make a claim about whether 0.999... equals 1.',
      evidence: 'Use algebraic reasoning: Let x = 0.999..., then 10x = 9.999... Subtract to find 9x. What evidence does this provide?',
      reasoning: 'Connect your evidence to properties of real numbers and the meaning of infinite decimal representations.',
    },
    keyTerms: ['repeating decimal', 'algebraic proof', 'subtraction', 'equals', 'infinite', 'real numbers'],
    rubric: {
      claim: { excellent: 'Clearly states 0.999... = 1 and that they are the same real number', adequate: 'States they are equal', developing: 'Unsure or states they are close but not equal' },
      evidence: { excellent: 'Shows: x = 0.999..., 10x = 9.999..., 10x - x = 9, 9x = 9, x = 1', adequate: 'Attempts algebraic argument with minor errors', developing: 'Limited or no mathematical evidence' },
      reasoning: { excellent: 'Explains that every real number has a unique position on the number line and there is no number between 0.999... and 1', adequate: 'Mentions the algebra proves they are equal', developing: 'Incomplete reasoning' },
    },
  },
  'prime-numbers-cryptography': {
    domain: 'ms-math-numbers',
    title: 'Why Do Banks Use Prime Numbers?',
    phenomenon: 'Online banking and secure websites use encryption based on very large prime numbers. RSA encryption works because it is easy to multiply two large primes but extremely difficult to factor the product back into primes.',
    scaffold: {
      claim: 'Make a claim about why prime numbers are important for keeping digital information secure.',
      evidence: 'Multiply 17 × 23. Now, given only the number 391, try to find its prime factors without knowing them. Compare the difficulty.',
      reasoning: 'Explain how the difficulty of prime factorization for very large numbers (hundreds of digits) makes encryption secure.',
    },
    keyTerms: ['prime numbers', 'factorization', 'multiplication', 'encryption', 'security', 'difficulty'],
    rubric: {
      claim: { excellent: 'States that prime factorization of large numbers is computationally difficult, making encryption secure', adequate: 'States primes are used for security', developing: 'Vague claim' },
      evidence: { excellent: 'Shows 17 × 23 = 391 is easy but factoring 391 requires trial division and is harder', adequate: 'Mentions multiplication is easier than factoring', developing: 'No specific example' },
      reasoning: { excellent: 'Explains that with hundreds-of-digit primes, factoring would take billions of years, making the code unbreakable in practice', adequate: 'Mentions large numbers are hard to factor', developing: 'Incomplete connection' },
    },
  },
  'irrational-measurement': {
    domain: 'ms-math-numbers',
    title: 'Can You Measure √2 Exactly?',
    phenomenon: 'The diagonal of a 1×1 square is √2 ≈ 1.41421356... This number never terminates and never repeats. Yet you can draw this line segment exactly with a ruler and compass.',
    scaffold: {
      claim: 'Make a claim about whether irrational numbers can represent real, physical lengths.',
      evidence: 'Use the Pythagorean theorem: 1² + 1² = c². What is c? Draw a 1×1 square and its diagonal. Can you measure the diagonal?',
      reasoning: 'Explain the difference between a number being irrational (infinite non-repeating decimal) and a length being real and constructible.',
    },
    keyTerms: ['irrational', 'square root', 'Pythagorean theorem', 'diagonal', 'measurement', 'decimal expansion'],
    rubric: {
      claim: { excellent: 'States that irrational numbers represent real lengths even though we cannot write them as exact decimals', adequate: 'States √2 is a real length', developing: 'Confused about irrational = not real' },
      evidence: { excellent: 'Uses Pythagorean theorem to show diagonal = √2 and notes the construction is exact', adequate: 'Mentions √2 comes from the theorem', developing: 'Limited evidence' },
      reasoning: { excellent: 'Explains that irrational means we cannot express it as a fraction, but it exists as a precise point on the number line and as a constructible length', adequate: 'Mentions irrational numbers are real', developing: 'Incomplete reasoning' },
    },
  },
  'fraction-division-real-world': {
    domain: 'ms-math-numbers',
    title: 'Why Does Dividing by a Fraction Give a Bigger Number?',
    phenomenon: 'When you divide 6 by 1/2, you get 12 — a number larger than what you started with. This surprises many students who expect division to always make numbers smaller.',
    scaffold: {
      claim: 'Make a claim about when division makes a number larger versus smaller.',
      evidence: 'Calculate: 6 ÷ 2, 6 ÷ 1, 6 ÷ 1/2, 6 ÷ 1/3. What pattern do you see?',
      reasoning: 'Use the concept of "how many groups fit" to explain why dividing by a number less than 1 gives a result greater than the dividend.',
    },
    keyTerms: ['division', 'fraction', 'reciprocal', 'groups', 'less than one', 'greater'],
    rubric: {
      claim: { excellent: 'States that dividing by a number less than 1 gives a result greater than the original, while dividing by a number greater than 1 gives a smaller result', adequate: 'States dividing by a fraction gives a bigger number', developing: 'Vague claim' },
      evidence: { excellent: 'Shows 6÷2=3, 6÷1=6, 6÷(1/2)=12, 6÷(1/3)=18 and identifies the pattern', adequate: 'Shows some calculations', developing: 'Limited evidence' },
      reasoning: { excellent: 'Explains that 6÷(1/2) asks how many halves fit into 6, and since halves are small, many fit, giving a larger number', adequate: 'Mentions fitting more pieces', developing: 'Incomplete reasoning' },
    },
  },
  'negative-numbers-history': {
    domain: 'ms-math-numbers',
    title: 'Are Negative Numbers Real?',
    phenomenon: 'For centuries, mathematicians called negative numbers "absurd" or "fictitious." The ancient Greeks, who invented much of geometry, refused to accept them. Yet today, negative numbers are essential in science, finance, and everyday life.',
    scaffold: {
      claim: 'Make a claim about whether negative numbers represent real quantities.',
      evidence: 'Give three real-world examples where negative numbers are necessary and meaningful.',
      reasoning: 'Explain why the number line must extend in both directions and why mathematics needs numbers below zero.',
    },
    keyTerms: ['negative numbers', 'temperature', 'debt', 'elevation', 'number line', 'real-world'],
    rubric: {
      claim: { excellent: 'States that negative numbers represent real quantities such as debt, temperature below zero, and depth below sea level', adequate: 'States negative numbers are real', developing: 'Unsure or incomplete' },
      evidence: { excellent: 'Gives three clear examples: temperature (-40°C), bank balance (-$50), elevation (-100 m below sea level)', adequate: 'Gives one or two examples', developing: 'Vague examples' },
      reasoning: { excellent: 'Explains that the number line is a model for all quantities including those less than zero and that operations like subtraction naturally produce negative results', adequate: 'Mentions the number line', developing: 'Incomplete reasoning' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY — key terms per category
// ═══════════════════════════════════════════════════════════════════════════════

const VOCABULARY = {
  'integer-operations': [
    { term: 'integer', definition: 'A whole number that can be positive, negative, or zero (..., -3, -2, -1, 0, 1, 2, 3, ...).' },
    { term: 'additive inverse', definition: 'The opposite of a number; the number that when added to the original gives zero. The additive inverse of 5 is -5.' },
    { term: 'absolute value', definition: 'The distance of a number from zero on the number line; always non-negative. Written |x|.' },
    { term: 'order of operations', definition: 'The agreed-upon rules for the sequence of calculations: Parentheses, Exponents, Multiplication/Division (left to right), Addition/Subtraction (left to right). PEMDAS.' },
    { term: 'commutative property', definition: 'Changing the order of addition or multiplication does not change the result. a + b = b + a.' },
    { term: 'associative property', definition: 'Changing the grouping of addition or multiplication does not change the result. (a + b) + c = a + (b + c).' },
    { term: 'distributive property', definition: 'Multiplying a sum by a number equals multiplying each addend by that number and then adding. a(b + c) = ab + ac.' },
  ],
  'fractions': [
    { term: 'fraction', definition: 'A number expressed as a ratio of two integers, written a/b where b ≠ 0.' },
    { term: 'numerator', definition: 'The top number in a fraction; represents how many parts are taken.' },
    { term: 'denominator', definition: 'The bottom number in a fraction; represents the total number of equal parts.' },
    { term: 'equivalent fractions', definition: 'Fractions that represent the same value, such as 1/2 and 2/4.' },
    { term: 'improper fraction', definition: 'A fraction where the numerator is greater than or equal to the denominator, such as 7/4.' },
    { term: 'mixed number', definition: 'A number consisting of a whole number and a proper fraction, such as 1 3/4.' },
    { term: 'reciprocal', definition: 'The multiplicative inverse of a fraction; flip numerator and denominator. The reciprocal of 2/3 is 3/2.' },
    { term: 'least common denominator (LCD)', definition: 'The smallest common multiple of the denominators of two or more fractions.' },
  ],
  'decimals': [
    { term: 'decimal', definition: 'A number written using a decimal point to show values less than one (tenths, hundredths, etc.).' },
    { term: 'place value', definition: 'The value of a digit based on its position in a number. In 3.45, the 4 is in the tenths place (value 0.4).' },
    { term: 'terminating decimal', definition: 'A decimal that has a finite number of digits, such as 0.25 or 0.375.' },
    { term: 'repeating decimal', definition: 'A decimal in which a digit or group of digits repeats infinitely, such as 0.333... or 0.142857142857...' },
    { term: 'rounding', definition: 'Approximating a number to a specified place value. 3.456 rounded to the hundredths place is 3.46.' },
  ],
  'exponents-roots': [
    { term: 'exponent', definition: 'A number that tells how many times the base is multiplied by itself. In 2^5, the exponent is 5.' },
    { term: 'base', definition: 'The number being raised to a power. In 2^5, the base is 2.' },
    { term: 'power', definition: 'An expression of the form a^n; also refers to the result (2^5 = 32, so 32 is a power of 2).' },
    { term: 'square root', definition: 'A number that when multiplied by itself gives the original number. √25 = 5 because 5 × 5 = 25.' },
    { term: 'cube root', definition: 'A number that when cubed gives the original number. ∛27 = 3 because 3 × 3 × 3 = 27.' },
    { term: 'scientific notation', definition: 'A way to write very large or small numbers as a coefficient (1-10) times a power of 10. Example: 4500 = 4.5 × 10^3.' },
    { term: 'perfect square', definition: 'A number that is the square of a whole number: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100...' },
    { term: 'perfect cube', definition: 'A number that is the cube of a whole number: 1, 8, 27, 64, 125, 216...' },
  ],
  'number-properties': [
    { term: 'factor', definition: 'A number that divides evenly into another number. Factors of 12: 1, 2, 3, 4, 6, 12.' },
    { term: 'multiple', definition: 'The product of a number and any whole number. Multiples of 5: 5, 10, 15, 20...' },
    { term: 'prime number', definition: 'A number greater than 1 whose only factors are 1 and itself. Examples: 2, 3, 5, 7, 11, 13.' },
    { term: 'composite number', definition: 'A number greater than 1 that has more than two factors. Examples: 4, 6, 8, 9, 10.' },
    { term: 'prime factorization', definition: 'Writing a number as a product of its prime factors. 60 = 2² × 3 × 5.' },
    { term: 'greatest common factor (GCF)', definition: 'The largest factor shared by two or more numbers. GCF of 12 and 18 is 6.' },
    { term: 'least common multiple (LCM)', definition: 'The smallest multiple shared by two or more numbers. LCM of 4 and 6 is 12.' },
    { term: 'rational number', definition: 'A number that can be expressed as a/b where a and b are integers and b ≠ 0. Includes fractions, terminating decimals, and repeating decimals.' },
    { term: 'irrational number', definition: 'A number that cannot be expressed as a fraction of integers. Its decimal expansion is non-terminating and non-repeating. Examples: √2, π.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIOS — real-world application scenarios for lessons
// ═══════════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { title: 'Baking with Fractions', focus: 'fraction operations, mixed numbers', text: 'A recipe for 12 cookies calls for 2 1/4 cups of flour, 3/4 cup of sugar, and 1/3 cup of butter. You want to make 18 cookies (1.5 times the recipe). Calculate the new amounts for each ingredient. Then determine how much flour is left if you started with a 5-pound bag (about 20 cups).' },
  { title: 'Sports Statistics', focus: 'decimals, fractions, percentages', text: 'A basketball player made 27 out of 40 free throws this season. Express her success rate as a fraction, a decimal, and a percentage. If she wants a 0.750 (75%) rate by the end of the season and has 20 more free throws to attempt, how many must she make?' },
  { title: 'Elevation Changes', focus: 'integers, absolute value', text: 'A hiker starts at 150 meters above sea level, descends 230 meters into a canyon, then climbs 185 meters up the other side. Write integer expressions for each change in elevation, find the final elevation, and calculate the total vertical distance traveled (using absolute values).' },
  { title: 'Scientific Measurement', focus: 'scientific notation, exponents', text: 'A human hair is about 7 × 10^(-5) m wide. A red blood cell is about 7 × 10^(-6) m in diameter. The distance from Earth to the Sun is about 1.5 × 10^8 km. Compare these measurements: How many times wider is a hair than a blood cell? How many hairs laid end-to-end would stretch to the Sun?' },
  { title: 'Budget Planning', focus: 'decimal operations, fractions', text: 'A student receives a $50 weekly allowance. They spend 2/5 on lunch, 1/4 on transportation, and save the rest. Calculate the dollar amount for each category. If lunch prices increase by $0.75 per day (5 days), what is the new lunch budget as a fraction of the total?' },
  { title: 'Music and Math', focus: 'fractions, equivalent fractions, addition', text: 'In 4/4 time, a measure must contain notes that add up to 4 beats. A whole note = 4 beats, half note = 2 beats, quarter note = 1 beat, eighth note = 1/2 beat, sixteenth note = 1/4 beat. Create three different measures using at least 3 different note types each. Express the beats as fraction addition to verify each measure totals exactly 4 beats.' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Exercise generation helper
// ═══════════════════════════════════════════════════════════════════════════════

function generateExercise(skill, count = 5, mastery = null, seenQ = null) {
  return _generateExercise({ bank: QUESTION_BANKS[skill], skill, count, mastery, seenQ, type: 'exercise', instruction: 'Answer each question.' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS — extends DomainSkillBase
// ═══════════════════════════════════════════════════════════════════════════════

class MSMathNumbers extends DomainSkillBase {
  constructor() {
    super('ms-math-numbers', 'ms-math-numbers', DATA_DIR, loadProfile, saveProfile, HINT_BANKS);
  }

  getProfile(id) {
    const p = loadProfile(id);
    return { studentId: p.studentId, createdAt: p.createdAt, totalAssessments: p.assessments.length };
  }

  recordAssessment(id, skill, score, total, notes = '', hintsUsed = 0) {
    if (!QUESTION_BANKS[skill]) throw new Error(`Unknown skill: ${skill}`);
    if (typeof total !== 'number' || total <= 0) throw new Error('total must be positive');
    if (typeof score !== 'number' || score < 0 || score > total) throw new Error(`score must be 0-${total}`);
    const p = loadProfile(id);
    const hintsClamp = Math.max(0, Math.min(3, Number(hintsUsed) || 0));
    const hintMultiplier = [1.0, 0.75, 0.50, 0.25][hintsClamp];
    const entry = { date: new Date().toISOString(), skill, score, total, notes, hintsUsed: hintsClamp, hintMultiplier };
    p.assessments.push(entry);
    if (!p.skills[skill]) p.skills[skill] = { attempts: [] };
    p.skills[skill].attempts.push({ date: entry.date, score, total, hintsUsed: hintsClamp, hintMultiplier });
    p.skills[skill].mastery = calcMastery(p.skills[skill].attempts);
    p.skills[skill].label = masteryLabel(p.skills[skill].mastery);
    p.skills[skill].sr = srUpdate(p.skills[skill].sr || null, score, total);
    // FSRS scheduling
    const _fg = score / total >= 0.9 ? 4 : score / total >= 0.7 ? 3 : score / total >= 0.5 ? 2 : 1;
    const _pf = p.skills[skill].fsrs || { stability: 2.5, difficulty: 5 };
    const _ns = fsrsUpdateStability(_pf.stability, _pf.difficulty, _fg);
    const _nd = fsrsUpdateDifficulty(_pf.difficulty, _fg);
    const _di = fsrsNextReview(_ns);
    const _dd = new Date();
    _dd.setDate(_dd.getDate() + _di);
    p.skills[skill].fsrs = { stability: _ns, difficulty: _nd, due: _dd.toISOString().slice(0, 10), lastReviewed: today() };
    saveProfile(p);
    return { studentId: id, skill, score: `${score}/${total}`, mastery: p.skills[skill].mastery, label: p.skills[skill].label };
  }

  getProgress(id) {
    const p = loadProfile(id);
    const results = {};
    let mastered = 0, total = 0;
    for (const [cat, skills] of Object.entries(SKILLS)) {
      results[cat] = {};
      for (const sk of skills) {
        total++;
        const d = p.skills[sk];
        const hu = p.hintUsage?.[sk];
        results[cat][sk] = d
          ? { mastery: d.mastery, label: d.label, ...(hu && hu.totalHints > 0 ? { hintsUsed: hu.totalHints } : {}) }
          : { mastery: 0, label: 'not-started' };
        if (d && d.mastery >= MASTERY_THRESHOLD) mastered++;
      }
    }
    const totalHints = Object.values(p.hintUsage || {}).reduce((s, h) => s + (h.totalHints || 0), 0);
    return { studentId: id, mastered, total, overallPct: total > 0 ? Math.round(mastered / total * 100) : 0, totalHintsUsed: totalHints, skills: results };
  }

  getNextSkills(id, count = 5) {
    const p = loadProfile(id);
    const candidates = [];
    for (const [cat, skills] of Object.entries(SKILLS)) {
      for (const sk of skills) {
        const d = p.skills[sk];
        const m = d ? d.mastery : 0;
        if (m < MASTERY_THRESHOLD && _numbersTopicUnlocked(sk, p.skills)) {
          candidates.push({ category: cat, skill: sk, mastery: m, label: d ? d.label : 'not-started', fsrs: d ? d.fsrs || null : null });
        }
      }
    }
    const order = { developing: 0, emerging: 1, 'not-started': 2 };
    const _td = today();
    candidates.sort((a, b) => {
      const aDue = (a.fsrs && a.fsrs.due <= _td && a.mastery > 0) ? 1 : 0;
      const bDue = (b.fsrs && b.fsrs.due <= _td && b.mastery > 0) ? 1 : 0;
      if (aDue !== bDue) return bDue - aDue;
      return (order[a.label] ?? 3) - (order[b.label] ?? 3) || b.mastery - a.mastery;
    });
    return { studentId: id, next: candidates.slice(0, count) };
  }

  getProgressionMap(id) {
    const p = loadProfile(id);
    const topics = [];
    let unlocked = 0, gated = 0, mastered = 0;
    for (const [cat, skills] of Object.entries(SKILLS)) {
      for (const sk of skills) {
        const d = p.skills[sk];
        const m = d ? d.mastery : 0;
        const prereqs = TOPIC_PREREQUISITES[sk] || [];
        const isUnlocked = _numbersTopicUnlocked(sk, p.skills);
        const blockedBy = prereqs.filter(r => (p.skills[r]?.mastery || 0) < MASTERY_THRESHOLD);
        if (m >= MASTERY_THRESHOLD) mastered++;
        else if (isUnlocked) unlocked++;
        else gated++;
        topics.push({ topic: sk, category: cat, mastery: m, label: d ? d.label : 'not-started', unlocked: isUnlocked, prerequisites: prereqs, blockedBy: isUnlocked ? [] : blockedBy, neededMastery: isUnlocked ? null : MASTERY_THRESHOLD });
      }
    }
    return { studentId: id, summary: { total: topics.length, mastered, unlocked, gated }, topics };
  }

  getReport(id) {
    const p = loadProfile(id);
    const hintStats = {};
    for (const [sk, hu] of Object.entries(p.hintUsage || {})) {
      if (hu.totalHints > 0) hintStats[sk] = { totalHints: hu.totalHints };
    }
    return { studentId: id, progress: this.getProgress(id), hintStats, recentAssessments: p.assessments.slice(-20).reverse() };
  }

  listStudents() {
    const students = listProfiles(DATA_DIR);
    return { count: students.length, students };
  }

  getSkillCatalog() {
    const catalog = {};
    let total = 0;
    for (const [cat, skills] of Object.entries(SKILLS)) {
      total += skills.length;
      catalog[cat] = [...skills];
    }
    return { skills: catalog, totalSkills: total };
  }

  generateExercise(skill, count = 5, mastery = null, seenQ = null) {
    return generateExercise(skill, count, mastery, seenQ);
  }

  generateLesson(id) {
    const p = loadProfile(id);
    const target = this.getNextSkills(id, 3).next[0];
    if (!target) return { message: 'All numbers & operations skills are proficient!', congratulations: true };
    const skillMastery = p.skills[target.skill]?.mastery || 0;
    const exercise = generateExercise(target.skill, 5, skillMastery);
    const scenario = SCENARIOS.length > 0 ? pick(SCENARIOS, 1)[0] : null;
    const diff = buildDiffContext(p);
    return {
      studentId: id, targetSkill: target, exercise, scenario,
      lessonPlan: {
        review: 'Review previously learned concepts (2-3 min)',
        teach: `Introduce/reinforce: ${target.category} → ${target.skill}`,
        practice: `Complete ${exercise.count || 0} practice items`,
        apply: scenario ? `Analyze scenario: "${scenario.title}"` : 'Connect to real-world math applications',
        extend: `Connect ${target.skill} to related number concepts`,
      },
      ...(diff ? { differentiation: diff } : {}),
    };
  }

  checkAnswer(type, expected, answer, skill) {
    let exp = expected;
    try { exp = JSON.parse(expected); } catch {}
    const correct = _checkAnswer(exp, answer);
    const result = { correct, expected: exp, studentAnswer: answer };
    if (!correct && skill) {
      const mcs = MISCONCEPTIONS[skill];
      if (mcs) {
        for (const mc of mcs) {
          if (mc.patterns.some(p => p.test(answer))) {
            result.misconception = true;
            result.correction = mc.correction;
            break;
          }
        }
      }
    }
    return result;
  }

  getLab(name) {
    if (!name) return { labs: Object.keys(VIRTUAL_LABS), instructions: 'node numbers.js lab <id> <lab-name> [obs-key]' };
    const lab = VIRTUAL_LABS[name];
    if (!lab) return { error: `Unknown lab: ${name}. Available: ${Object.keys(VIRTUAL_LABS).join(', ')}` };
    return { lab: name, ...lab };
  }

  getLabObservation(name, obsKey) {
    const lab = VIRTUAL_LABS[name];
    if (!lab) return { error: `Unknown lab: ${name}` };
    if (!obsKey) return { available: Object.keys(lab.observations) };
    const obs = lab.observations[obsKey];
    if (!obs) return { error: `Unknown observation key: ${obsKey}. Available: ${Object.keys(lab.observations).join(', ')}` };
    return { lab: name, key: obsKey, observation: obs };
  }

  // Override base class to use local ms-math diagrams
  getDiagramData(id, topic) {
    if (!topic) {
      return { availableDiagrams: Object.keys(DIAGRAMS_LOCAL).map(k => ({ key: k, topic: DIAGRAMS_LOCAL[k].topic, skill: DIAGRAMS_LOCAL[k].skill })) };
    }
    const d = DIAGRAMS_LOCAL[topic];
    if (!d) return { error: `Unknown diagram: ${topic}. Available: ${Object.keys(DIAGRAMS_LOCAL).join(', ')}` };
    return { diagramKey: topic, domain: d.domain, skill: d.skill, topic: d.topic, description: d.description, diagram: d.diagram, labelCount: Object.keys(d.labels).length };
  }

  checkDiagramAnswers(id, topic, answers) {
    const d = DIAGRAMS_LOCAL[topic];
    if (!d) return { error: `Unknown diagram: ${topic}` };
    let correct = 0;
    const total = Object.keys(d.labels).length;
    const results = {};
    for (const [key, expected] of Object.entries(d.labels)) {
      const student = (answers[key] || '').trim().toLowerCase();
      const exp = expected.toLowerCase();
      const match = student === exp || exp.includes(student) || student.includes(exp);
      if (match) correct++;
      results[key] = { expected, studentAnswer: answers[key] || '', correct: match };
    }
    return { studentId: id, topic, correct, total, score: `${correct}/${total}`, results };
  }

  getCER(id, topic) {
    if (!topic) {
      return { studentId: id, availableTopics: Object.keys(CER_PHENOMENA_LOCAL).map(k => ({ key: k, title: CER_PHENOMENA_LOCAL[k].title })) };
    }
    const c = CER_PHENOMENA_LOCAL[topic];
    if (!c) return { error: `Unknown CER topic: ${topic}. Available: ${Object.keys(CER_PHENOMENA_LOCAL).join(', ')}` };
    return {
      studentId: id,
      phenomenon: c,
      scaffold: c.scaffold,
      instructions: 'Present the phenomenon to the student. Ask them to write: (1) Claim, (2) Evidence, (3) Reasoning. Then call cer-check with their responses.',
    };
  }

  checkCER(id, topic, claim, evidence, reasoning) {
    const c = CER_PHENOMENA_LOCAL[topic];
    if (!c) return { error: `Unknown CER topic: ${topic}` };
    const scoreText = (text, kws) => {
      if (!kws || !kws.length) return { score: 2, feedback: 'Reviewed' };
      const t = text.toLowerCase();
      const hits = kws.filter(k => t.includes(k.toLowerCase()));
      const pct = hits.length / kws.length;
      return { score: pct >= 0.6 ? 3 : pct >= 0.3 ? 2 : 1, hits, feedback: pct >= 0.6 ? 'Strong' : pct >= 0.3 ? 'Developing' : 'Needs work' };
    };
    const kw = c.keyTerms || [];
    const scores = { claim: scoreText(claim, kw), evidence: scoreText(evidence, kw), reasoning: scoreText(reasoning, kw) };
    const total = scores.claim.score + scores.evidence.score + scores.reasoning.score;
    return { studentId: id, topic, scores, total, maxScore: 9 };
  }

  getDiagramLocal(topic) {
    if (!topic) {
      return { availableDiagrams: Object.keys(DIAGRAMS_LOCAL).map(k => ({ key: k, topic: DIAGRAMS_LOCAL[k].topic, skill: DIAGRAMS_LOCAL[k].skill })) };
    }
    const d = DIAGRAMS_LOCAL[topic];
    if (!d) return { error: `Unknown diagram: ${topic}. Available: ${Object.keys(DIAGRAMS_LOCAL).join(', ')}` };
    return { diagramKey: topic, ...d, labelCount: Object.keys(d.labels).length };
  }

  getCERLocal(topic) {
    if (!topic) {
      return { availableTopics: Object.keys(CER_PHENOMENA_LOCAL).map(k => ({ key: k, title: CER_PHENOMENA_LOCAL[k].title })) };
    }
    const c = CER_PHENOMENA_LOCAL[topic];
    if (!c) return { error: `Unknown CER topic: ${topic}. Available: ${Object.keys(CER_PHENOMENA_LOCAL).join(', ')}` };
    return { topic, ...c };
  }

  getPhenomenon(category) {
    if (!category) {
      const all = {};
      for (const [cat, arr] of Object.entries(PHENOMENA)) {
        all[cat] = arr.map(p => p.title);
      }
      return { categories: all };
    }
    const phens = PHENOMENA[category];
    if (!phens) return { error: `Unknown category: ${category}. Available: ${Object.keys(PHENOMENA).join(', ')}` };
    return pick(phens, 1)[0];
  }

  getScenario() {
    if (!SCENARIOS.length) return { error: 'No scenarios available.' };
    return pick(SCENARIOS, 1)[0];
  }

  review(id) {
    const p = loadProfile(id);
    const due = [];
    for (const [skill, data] of Object.entries(p.skills)) {
      if (data.mastery > 0 && (data.fsrs ? data.fsrs.due <= new Date().toISOString().slice(0, 10) : srDueToday(data.sr))) {
        const effMastery = srEffectiveMastery(data.mastery || 0, data.sr);
        due.push({
          skill,
          effectiveMastery: effMastery,
          label: masteryLabel(effMastery),
          nextReview: data.sr?.nextReview || null,
          exercise: generateExercise(skill, 3, data.mastery || 0),
        });
      }
    }
    due.sort((a, b) => a.effectiveMastery - b.effectiveMastery);
    return {
      studentId: id, today: new Date().toISOString().slice(0, 10), dueCount: due.length, reviewSessions: due,
      message: due.length === 0 ? 'No numbers skills due for review today!' : `${due.length} skill(s) need review. Work through each exercise below.`,
    };
  }
}

module.exports = MSMathNumbers;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI: node numbers.js <command> [args]
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const api = new MSMathNumbers();
  const common = buildCommonCLIHandlers(api, DATA_DIR, 'ms-math-numbers', loadProfile, saveProfile);
  runCLI((cmd, args, out) => {
    if (cmd !== 'lab' && common(cmd, args, out)) return;
    switch (cmd) {
      case 'start': {
        const [, id] = args;
        if (!id) throw new Error('Usage: start <id>');
        const ss = loadSessionState(DATA_DIR, id);
        out({ action: 'start', profile: api.getProfile(id), nextSkills: api.getNextSkills(id), sessionState: ss || null });
        break;
      }
      case 'exercise': {
        const [, id, skill] = args;
        if (!id) throw new Error('Usage: exercise <id> [skill]');
        const _pp = loadProfile(id);
        const _getM = sk => _pp.skills[sk]?.mastery || 0;
        const _getSeenQ = sk => _pp.correctQ?.[sk] || [];
        if (skill) {
          const r = api.generateExercise(skill, 5, _getM(skill), _getSeenQ(skill));
          saveSessionState(DATA_DIR, id, { command: 'exercise', skill, questionIndex: 0 });
          out(r);
        } else {
          const n = api.getNextSkills(id, 1).next;
          if (n.length) {
            const r = api.generateExercise(n[0].skill, 5, _getM(n[0].skill), _getSeenQ(n[0].skill));
            saveSessionState(DATA_DIR, id, { command: 'exercise', skill: n[0].skill, questionIndex: 0 });
            out(r);
          } else {
            out({ message: 'All skills proficient!' });
          }
        }
        break;
      }
      case 'record': {
        const [, id, skill, sc, tot, hints, ...notes] = args;
        if (!id || !skill || !sc || !tot) throw new Error('Usage: record <id> <skill> <score> <total> [hints] [notes]');
        const r = api.recordAssessment(id, skill, Number(sc), Number(tot), notes.join(' '), Number(hints) || 0);
        saveSessionState(DATA_DIR, id, { command: 'record', skill });
        out(r);
        break;
      }
      case 'phenomenon': {
        const [, category] = args;
        out(api.getPhenomenon(category || null));
        break;
      }
      case 'lab': {
        const [, id, name, obsKey] = args;
        if (!id) throw new Error('Usage: lab <id> [lab-name] [obs-key]');
        if (!name) {
          out(api.getLab());
        } else if (!obsKey) {
          out(api.getLab(name));
        } else {
          out(api.getLabObservation(name, obsKey));
        }
        break;
      }
      case 'diagram': {
        const [, id, topic] = args;
        if (!id) throw new Error('Usage: diagram <id> [topic]');
        out(api.getDiagramLocal(topic || null));
        break;
      }
      case 'diagram-check': {
        const [, id, topic, answersJson] = args;
        if (!id || !topic || !answersJson) throw new Error("Usage: diagram-check <id> <topic> <answers-json>");
        let ans;
        try { ans = JSON.parse(answersJson); } catch { throw new Error("answers-json must be valid JSON e.g. '{\"A\":\"normal force\"}'"); }
        const d = DIAGRAMS_LOCAL[topic];
        if (!d) { out({ error: `Unknown diagram: ${topic}` }); break; }
        let correct = 0;
        const total = Object.keys(d.labels).length;
        const results = {};
        for (const [key, expected] of Object.entries(d.labels)) {
          const studentAns = ans[key] || '';
          const isCorrect = studentAns.toLowerCase().trim().includes(expected.toLowerCase().trim()) || expected.toLowerCase().trim().includes(studentAns.toLowerCase().trim());
          if (isCorrect) correct++;
          results[key] = { expected, studentAnswer: studentAns, correct: isCorrect };
        }
        out({ studentId: id, topic, correct, total, score: `${correct}/${total}`, results });
        break;
      }
      case 'cer': {
        const [, id, topic] = args;
        if (!id) throw new Error('Usage: cer <id> [topic]');
        out(api.getCERLocal(topic || null));
        break;
      }
      case 'cer-check': {
        const [, id, topic, claim, evidence, reasoning] = args;
        if (!id || !topic || !claim || !evidence || !reasoning) throw new Error('Usage: cer-check <id> <topic> <claim> <evidence> <reasoning>');
        const c = CER_PHENOMENA_LOCAL[topic];
        if (!c) { out({ error: `Unknown CER topic: ${topic}` }); break; }
        const rubric = c.rubric;
        const scores = {};
        // Simple keyword-based scoring
        for (const component of ['claim', 'evidence', 'reasoning']) {
          const text = { claim, evidence, reasoning }[component].toLowerCase();
          const keywords = c.keyTerms.filter(t => text.includes(t.toLowerCase()));
          if (keywords.length >= 3) scores[component] = { score: 3, level: 'excellent', keywordsFound: keywords };
          else if (keywords.length >= 1) scores[component] = { score: 2, level: 'adequate', keywordsFound: keywords };
          else scores[component] = { score: 1, level: 'developing', keywordsFound: keywords };
        }
        const total = scores.claim.score + scores.evidence.score + scores.reasoning.score;
        out({ studentId: id, topic, scores, total, maxTotal: 9, rubric });
        break;
      }
      case 'scenario': {
        out(api.getScenario());
        break;
      }
      case 'help': out({
        skill: 'ms-math-numbers',
        gradeLevel: '6-8',
        standards: 'Common Core Math 6-8 (Numbers & Operations)',
        usage: 'node numbers.js <command> [args]',
        commands: {
          'start <id>': 'Start a student session; includes last session state for resume prompt',
          'resume <id>': 'Resume last session or offer to start fresh if >24h old',
          'lesson <id>': 'Generate a lesson with concept explanation and exercises',
          'exercise <id> [skill]': 'Generate 5 practice items; optionally filter by skill',
          'check <id> <type> <expected> <answer> [skill]': 'Check an answer; returns misconception feedback if wrong',
          'record <id> <skill> <score> <total> [hints] [notes]': 'Save a scored assessment attempt',
          'progress <id>': 'Show mastery levels across all numbers skills',
          'report <id>': 'Full performance report with SR data',
          'next <id> [count]': 'List next skills to study (by lowest mastery)',
          'catalog': 'List all skill categories and topics',
          'students': 'List all student IDs with saved profiles',
          'review <id>': 'List skills due for spaced repetition today',
          'hint <id> <skill>': 'Get next hint tier (3 tiers; reduces mastery credit)',
          'hint-reset <id> [skill]': 'Reset hint counter for a skill',
          'lab <id> [lab-name] [obs-key]': 'Start or explore a virtual lab; omit name to list available labs',
          'diagram <id> [topic]': 'Show ASCII diagram with blank labels to fill in',
          'diagram-check <id> <topic> <answers-json>': 'Check label answers for a diagram',
          'cer <id> [topic]': 'Present a CER phenomenon with scaffold prompts',
          'cer-check <id> <topic> <claim> <evidence> <reasoning>': 'Evaluate CER response against rubric',
          'cer-history <id>': 'Show past CER attempts, scores, and trend',
          'vocab <id> [topic]': 'Pre-teach numbers vocabulary',
          'phenomenon [category]': 'Get a driving-question phenomenon for phenomenon-based learning',
          'scenario': 'Get a real-world application scenario',
          'profile <id> set-language-support <level>': 'Set ELL support',
          'profile <id> set-reading-level <grade>': 'Set reading level grade (6-8)',
          'profile <id> set-accommodations <list>': 'Set accommodations',
          'profile <id> show': 'Show current differentiation settings',
          'standards <id>': 'Show standards practiced and mastery per standard',
          'socratic <id> [topic]': 'Start a Socratic dialogue session',
          'socratic-record <id> <topic> <score> [notes]': 'Record completed Socratic session (score 0-100)',
          'suggest-next <id>': 'Cross-skill recommendations',
          'progression <id>': 'Show mastery-gated progression map',
        },
      }); break;
      default: out({
        usage: 'node numbers.js <command> [args]',
        commands: ['start', 'resume', 'lesson', 'exercise', 'check', 'record', 'progress', 'report', 'next', 'catalog', 'students', 'review', 'hint', 'hint-reset', 'lab', 'diagram', 'diagram-check', 'cer', 'cer-check', 'cer-history', 'vocab', 'phenomenon', 'scenario', 'profile', 'standards', 'socratic', 'socratic-record', 'suggest-next', 'progression', 'help'],
      });
    }
  });
}
