// eClaw MS Math Algebra Tutor (6-8).
// CCSS Math aligned — Algebraic Thinking (代数思维).

const { dataDir, loadProfile: _lp, saveProfile: _sp, listProfiles, calcMastery, masteryLabel, shuffle, pick, runCLI, srGrade, srUpdate, srEffectiveMastery, srDueToday, MASTERY_THRESHOLD, saveSessionState, loadSessionState, fsrsUpdateStability, fsrsUpdateDifficulty, fsrsNextReview, today } = require('../_lib/core');
const { buildDiffContext } = require('../_lib/differentiation');
const { DomainSkillBase, buildCommonCLIHandlers, generateExercise: _generateExercise, checkAnswer: _checkAnswer } = require('../_lib/exercise-factory');

const DATA_DIR = dataDir('ms-math-algebra');
const loadProfile = id => _lp(DATA_DIR, id);
const saveProfile = p => _sp(DATA_DIR, p);

const SKILLS = {
  'expressions': ['variables-constants', 'evaluating-expressions', 'simplifying-expressions', 'distributive-property', 'combining-like-terms'],
  'equations': ['one-step-equations', 'two-step-equations', 'multi-step-equations', 'equations-with-variables-both-sides', 'word-problems-equations'],
  'inequalities': ['inequality-basics', 'solving-inequalities', 'graphing-inequalities', 'compound-inequalities'],
  'linear-functions': ['function-basics', 'function-tables', 'slope', 'slope-intercept-form', 'graphing-linear-equations', 'writing-linear-equations'],
  'systems-advanced': ['systems-of-equations', 'exponent-expressions', 'polynomials-intro', 'quadratic-intro'],
};

// Prerequisites: topic → [topics that must be mastered first].
const TOPIC_PREREQUISITES = {
  // expressions (foundational)
  'variables-constants': [],
  'evaluating-expressions': ['variables-constants'],
  'simplifying-expressions': ['evaluating-expressions'],
  'distributive-property': ['simplifying-expressions'],
  'combining-like-terms': ['simplifying-expressions'],
  // equations (requires expressions)
  'one-step-equations': ['evaluating-expressions'],
  'two-step-equations': ['one-step-equations'],
  'multi-step-equations': ['two-step-equations', 'distributive-property', 'combining-like-terms'],
  'equations-with-variables-both-sides': ['multi-step-equations'],
  'word-problems-equations': ['two-step-equations'],
  // inequalities (requires equations)
  'inequality-basics': ['one-step-equations'],
  'solving-inequalities': ['inequality-basics', 'two-step-equations'],
  'graphing-inequalities': ['solving-inequalities'],
  'compound-inequalities': ['graphing-inequalities'],
  // linear-functions (requires equations)
  'function-basics': ['evaluating-expressions', 'one-step-equations'],
  'function-tables': ['function-basics'],
  'slope': ['function-tables'],
  'slope-intercept-form': ['slope', 'two-step-equations'],
  'graphing-linear-equations': ['slope-intercept-form'],
  'writing-linear-equations': ['slope-intercept-form'],
  // systems-advanced (requires linear functions)
  'systems-of-equations': ['graphing-linear-equations', 'equations-with-variables-both-sides'],
  'exponent-expressions': ['distributive-property', 'evaluating-expressions'],
  'polynomials-intro': ['exponent-expressions', 'combining-like-terms'],
  'quadratic-intro': ['polynomials-intro'],
};

// Helper: is a topic unlocked (all prereqs mastered)?
function _algebraTopicUnlocked(topic, profileSkills) {
  return (TOPIC_PREREQUISITES[topic] || []).every(r => (profileSkills[r]?.mastery || 0) >= MASTERY_THRESHOLD);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANKS — 8 questions per skill, CCSS Math aligned
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION_BANKS = {
  // ── expressions ─────────────────────────────────────────────────────────────
  'variables-constants': { questions: [
    { q: 'In the expression 3x + 7, which is the variable and which is the constant?', a: 'x is the variable and 7 is the constant', type: 'short', difficulty: 1 },
    { q: 'What is a variable in algebra?', a: 'a letter or symbol that represents an unknown or changing value', type: 'short', difficulty: 1 },
    { q: 'What is a constant in algebra?', a: 'a number that does not change', type: 'short', difficulty: 1 },
    { q: 'True or false: In the expression 5y - 3, the number 5 is a constant.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Identify all the terms in the expression 4a + 2b - 9.', a: ['4a, 2b, and -9', '4a, 2b, -9'], type: 'multi', difficulty: 2 },
    { q: 'In the expression 6m + 2n - 8, what is the coefficient of m?', a: '6', type: 'short', difficulty: 2 },
    { q: 'Write an algebraic expression for "five more than a number n."', a: ['n + 5', '5 + n'], type: 'multi', difficulty: 2 },
    { q: 'A store charges $12 per shirt plus $5 for shipping. Write an expression for the total cost of s shirts.', a: ['12s + 5', '5 + 12s'], type: 'multi', difficulty: 3 },
  ]},
  'evaluating-expressions': { questions: [
    { q: 'Evaluate 3x + 2 when x = 4.', a: '14', type: 'calculation', difficulty: 1 },
    { q: 'Evaluate 5a - 7 when a = 3.', a: '8', type: 'calculation', difficulty: 1 },
    { q: 'Evaluate 2x + 3y when x = 5 and y = 2.', a: '16', type: 'calculation', difficulty: 2 },
    { q: 'True or false: If x = 0, then 4x + 9 = 9.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Evaluate x^2 + 3 when x = 4.', a: '19', type: 'calculation', difficulty: 2 },
    { q: 'Evaluate (a + b)^2 when a = 3 and b = 2.', a: '25', type: 'calculation', difficulty: 2 },
    { q: 'A taxi charges $3 plus $2 per mile. The expression is 2m + 3. How much does a 7-mile ride cost?', a: '$17', type: 'short', difficulty: 2 },
    { q: 'Evaluate 4(x - 1) + 2x when x = 5.', a: '26', type: 'calculation', difficulty: 3 },
  ]},
  'simplifying-expressions': { questions: [
    { q: 'Simplify: 3x + 5x.', a: '8x', type: 'short', difficulty: 1 },
    { q: 'Simplify: 7a - 2a + 4.', a: '5a + 4', type: 'short', difficulty: 1 },
    { q: 'True or false: 3x + 4y can be simplified to 7xy.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Simplify: 2m + 5 + 3m - 1.', a: '5m + 4', type: 'short', difficulty: 1 },
    { q: 'Simplify: 6x + 3 - 2x + 7.', a: '4x + 10', type: 'short', difficulty: 2 },
    { q: 'Simplify: 4a + 2b - a + 3b.', a: '3a + 5b', type: 'short', difficulty: 2 },
    { q: 'Why can\'t you add 3x and 4y together into one term?', a: 'because they are not like terms since they have different variables', type: 'open', difficulty: 2 },
    { q: 'Simplify: 8p - 3q + 2p + 5q - p.', a: '9p + 2q', type: 'short', difficulty: 3 },
  ]},
  'distributive-property': { questions: [
    { q: 'Expand: 3(x + 4).', a: '3x + 12', type: 'short', difficulty: 1 },
    { q: 'Expand: 5(2a - 3).', a: '10a - 15', type: 'short', difficulty: 1 },
    { q: 'True or false: 2(x + 5) = 2x + 5.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Expand: -4(m + 2).', a: '-4m - 8', type: 'short', difficulty: 2 },
    { q: 'Expand and simplify: 2(x + 3) + 4x.', a: '6x + 6', type: 'short', difficulty: 2 },
    { q: 'Expand: -(3x - 7).', a: '-3x + 7', type: 'short', difficulty: 2 },
    { q: 'State the distributive property in your own words.', a: 'multiplying a number by a sum is the same as multiplying the number by each addend and then adding the products', type: 'open', difficulty: 2 },
    { q: 'Expand and simplify: 3(2x - 1) - 2(x + 4).', a: '4x - 11', type: 'short', difficulty: 3 },
  ]},
  'combining-like-terms': { questions: [
    { q: 'What are like terms?', a: 'terms that have the same variable raised to the same power', type: 'short', difficulty: 1 },
    { q: 'Combine like terms: 5x + 3x - 2x.', a: '6x', type: 'short', difficulty: 1 },
    { q: 'True or false: 4x^2 and 4x are like terms.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Combine like terms: 3a + 7 - a + 2.', a: '2a + 9', type: 'short', difficulty: 1 },
    { q: 'Combine like terms: 2x^2 + 5x + 3x^2 - x.', a: '5x^2 + 4x', type: 'short', difficulty: 2 },
    { q: 'Simplify by combining like terms: 4m - 3n + 2m + 8n - 5.', a: '6m + 5n - 5', type: 'short', difficulty: 2 },
    { q: 'Are 6xy and 3yx like terms? Explain.', a: 'yes because xy and yx are the same by the commutative property of multiplication', type: 'open', difficulty: 2 },
    { q: 'Combine like terms: 7a^2 - 3a + 2a^2 + a - 4.', a: '9a^2 - 2a - 4', type: 'short', difficulty: 3 },
  ]},

  // ── equations ───────────────────────────────────────────────────────────────
  'one-step-equations': { questions: [
    { q: 'Solve: x + 5 = 12.', a: ['x = 7', '7'], type: 'multi', difficulty: 1 },
    { q: 'Solve: y - 8 = 3.', a: ['y = 11', '11'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 4m = 20.', a: ['m = 5', '5'], type: 'multi', difficulty: 1 },
    { q: 'Solve: n / 3 = 9.', a: ['n = 27', '27'], type: 'multi', difficulty: 1 },
    { q: 'True or false: To solve x + 6 = 10, you add 6 to both sides.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Solve: -3x = 18.', a: ['x = -6', '-6'], type: 'multi', difficulty: 2 },
    { q: 'Solve: w / -2 = 5.', a: ['w = -10', '-10'], type: 'multi', difficulty: 2 },
    { q: 'Maria has some stickers. After giving away 9, she has 15 left. Write and solve an equation to find how many she started with.', a: ['x - 9 = 15 so x = 24', '24'], type: 'multi', difficulty: 3 },
  ]},
  'two-step-equations': { questions: [
    { q: 'Solve: 2x + 3 = 11.', a: ['x = 4', '4'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 3y - 7 = 14.', a: ['y = 7', '7'], type: 'multi', difficulty: 1 },
    { q: 'Solve: x/4 + 2 = 5.', a: ['x = 12', '12'], type: 'multi', difficulty: 2 },
    { q: 'True or false: When solving 5x + 3 = 18, the first step is to divide by 5.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Solve: -2a + 9 = 1.', a: ['a = 4', '4'], type: 'multi', difficulty: 2 },
    { q: 'Solve: 6 - m = 2.', a: ['m = 4', '4'], type: 'multi', difficulty: 2 },
    { q: 'A gym charges $25 per month plus a $50 signup fee. If Carlos paid $175 total, how many months did he pay for? Write and solve an equation.', a: ['25m + 50 = 175 so m = 5', '5 months', '5'], type: 'multi', difficulty: 3 },
    { q: 'Solve: (n + 3)/2 = 8.', a: ['n = 13', '13'], type: 'multi', difficulty: 3 },
  ]},
  'multi-step-equations': { questions: [
    { q: 'Solve: 3(x + 2) = 21.', a: ['x = 5', '5'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 2x + 3x - 4 = 16.', a: ['x = 4', '4'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 4(y - 1) + 2 = 18.', a: ['y = 5', '5'], type: 'multi', difficulty: 2 },
    { q: 'True or false: When solving 2(x + 5) = 20, you can start by distributing or by dividing both sides by 2.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Solve: 5m + 3 - 2m = 18.', a: ['m = 5', '5'], type: 'multi', difficulty: 2 },
    { q: 'Solve: 3(2a - 4) = 6.', a: ['a = 3', '3'], type: 'multi', difficulty: 2 },
    { q: 'Explain the steps you would take to solve 4(x + 1) - 2x = 10.', a: 'distribute 4 to get 4x + 4 - 2x = 10 then combine like terms to get 2x + 4 = 10 then subtract 4 to get 2x = 6 then divide by 2 to get x = 3', type: 'open', difficulty: 3 },
    { q: 'Solve: 2(3x + 1) - 4(x - 2) = 20.', a: ['x = 5', '5'], type: 'multi', difficulty: 3 },
  ]},
  'equations-with-variables-both-sides': { questions: [
    { q: 'Solve: 5x + 2 = 3x + 10.', a: ['x = 4', '4'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 7y - 3 = 4y + 9.', a: ['y = 4', '4'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 2a + 8 = 6a.', a: ['a = 2', '2'], type: 'multi', difficulty: 2 },
    { q: 'True or false: The equation 3x + 5 = 3x + 5 has infinitely many solutions.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Solve: 4(x + 1) = 2(x + 5).', a: ['x = 3', '3'], type: 'multi', difficulty: 2 },
    { q: 'Does the equation 2x + 6 = 2x + 3 have a solution? Explain.', a: 'no because subtracting 2x from both sides gives 6 = 3 which is false so there is no solution', type: 'open', difficulty: 2 },
    { q: 'Solve: 3(m - 2) = 2(m + 1).', a: ['m = 8', '8'], type: 'multi', difficulty: 3 },
    { q: 'Solve: 5(x - 3) + 2 = 3(x + 1).', a: ['x = 8', '8'], type: 'multi', difficulty: 3 },
  ]},
  'word-problems-equations': { questions: [
    { q: 'A number doubled and increased by 3 equals 17. What is the number?', a: ['7', 'x = 7'], type: 'multi', difficulty: 1 },
    { q: 'The perimeter of a rectangle is 30 cm. The length is 3 cm more than the width. Find the width.', a: ['6 cm', '6'], type: 'multi', difficulty: 2 },
    { q: 'True or false: "Five less than twice a number" translates to 5 - 2n.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Tickets cost $8 each. After buying tickets and paying a $5 service fee, the total is $37. How many tickets were bought?', a: ['4', '4 tickets'], type: 'multi', difficulty: 2 },
    { q: 'Two friends have a combined age of 25 years. One friend is 3 years older than the other. How old is each friend?', a: ['11 and 14', 'the younger is 11 and the older is 14'], type: 'multi', difficulty: 2 },
    { q: 'A phone plan costs $30 per month plus $0.10 per text. Last month the bill was $42. How many texts were sent?', a: ['120', '120 texts'], type: 'multi', difficulty: 2 },
    { q: 'Write an equation and solve: Three consecutive integers add up to 42.', a: ['n + (n+1) + (n+2) = 42 so n = 13 and the integers are 13 14 15', '13 14 15'], type: 'multi', difficulty: 3 },
    { q: 'A pool is being filled at 15 gallons per minute. It already has 200 gallons. A second pool is being filled at 25 gallons per minute and starts empty. After how many minutes will they have the same amount of water?', a: ['20 minutes', '20'], type: 'multi', difficulty: 3 },
  ]},

  // ── inequalities ────────────────────────────────────────────────────────────
  'inequality-basics': { questions: [
    { q: 'What does the symbol > mean?', a: 'greater than', type: 'short', difficulty: 1 },
    { q: 'Write an inequality: x is at least 5.', a: ['x >= 5', 'x ≥ 5'], type: 'multi', difficulty: 1 },
    { q: 'True or false: The inequality 3 < 7 is true.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Is x = 4 a solution to x > 3?', a: 'yes', type: 'short', difficulty: 1 },
    { q: 'Write an inequality for "a number n is less than 10."', a: ['n < 10'], type: 'multi', difficulty: 1 },
    { q: 'List three values of x that satisfy x <= 2.', a: ['any three numbers that are 2 or less such as 0 1 2 or -1 0 2', '0, 1, 2'], type: 'multi', difficulty: 2 },
    { q: 'How is an inequality different from an equation?', a: 'an equation shows two expressions are equal while an inequality shows one is greater than or less than the other and has many solutions', type: 'open', difficulty: 2 },
    { q: 'A roller coaster requires riders to be at least 48 inches tall. Write an inequality for height h.', a: ['h >= 48', 'h ≥ 48'], type: 'multi', difficulty: 2 },
  ]},
  'solving-inequalities': { questions: [
    { q: 'Solve: x + 3 > 7.', a: ['x > 4'], type: 'multi', difficulty: 1 },
    { q: 'Solve: 2y < 10.', a: ['y < 5'], type: 'multi', difficulty: 1 },
    { q: 'Solve: m - 4 >= 6.', a: ['m >= 10', 'm ≥ 10'], type: 'multi', difficulty: 1 },
    { q: 'True or false: When you multiply or divide both sides of an inequality by a negative number, you must flip the inequality sign.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Solve: -3x > 12.', a: ['x < -4'], type: 'multi', difficulty: 2 },
    { q: 'Solve: 2x + 5 <= 17.', a: ['x <= 6', 'x ≤ 6'], type: 'multi', difficulty: 2 },
    { q: 'Explain why you flip the sign when dividing by a negative number.', a: 'because dividing by a negative reverses the order of numbers on the number line so the direction of the inequality must reverse', type: 'open', difficulty: 3 },
    { q: 'Solve: 4 - 2x >= 10.', a: ['x <= -3', 'x ≤ -3'], type: 'multi', difficulty: 3 },
  ]},
  'graphing-inequalities': { questions: [
    { q: 'On a number line, how do you show x > 3?', a: 'an open circle at 3 with a line going to the right', type: 'short', difficulty: 1 },
    { q: 'On a number line, how do you show x <= 5?', a: 'a closed circle at 5 with a line going to the left', type: 'short', difficulty: 1 },
    { q: 'True or false: A closed circle on a number line means the value is included in the solution.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the difference between an open circle and a closed circle on a number line graph?', a: 'an open circle means the value is not included and a closed circle means the value is included', type: 'short', difficulty: 1 },
    { q: 'Solve x - 2 > 1 and describe how to graph the solution.', a: 'x > 3 so draw an open circle at 3 and shade to the right', type: 'short', difficulty: 2 },
    { q: 'A student graphed x >= -2 with an open circle at -2. What mistake did they make?', a: 'they should have used a closed circle because the inequality includes the value -2', type: 'short', difficulty: 2 },
    { q: 'Describe the graph of -1 < x <= 4 on a number line.', a: 'an open circle at -1 and a closed circle at 4 with the line shaded between them', type: 'short', difficulty: 3 },
    { q: 'If the graph shows a closed circle at 7 with shading to the left, write the inequality.', a: ['x <= 7', 'x ≤ 7'], type: 'multi', difficulty: 2 },
  ]},
  'compound-inequalities': { questions: [
    { q: 'What is a compound inequality?', a: 'two inequalities joined by the word "and" or "or"', type: 'short', difficulty: 1 },
    { q: 'Solve: 2 < x + 1 < 6.', a: ['1 < x < 5'], type: 'multi', difficulty: 2 },
    { q: 'True or false: The compound inequality x > 3 AND x < 8 can be written as 3 < x < 8.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Solve: x + 2 > 5 OR x - 1 < -3.', a: ['x > 3 or x < -2'], type: 'multi', difficulty: 2 },
    { q: 'What is the difference between "and" and "or" in compound inequalities?', a: '"and" means both conditions must be true so you find the overlap while "or" means at least one condition must be true so you combine the solutions', type: 'open', difficulty: 2 },
    { q: 'Solve: -3 <= 2x + 1 <= 7.', a: ['-2 <= x <= 3', '-2 ≤ x ≤ 3'], type: 'multi', difficulty: 3 },
    { q: 'A thermostat is set to keep the temperature between 65 and 75 degrees (inclusive). Write a compound inequality for temperature t.', a: ['65 <= t <= 75', '65 ≤ t ≤ 75'], type: 'multi', difficulty: 2 },
    { q: 'Solve: 3x - 1 > 8 OR 2x + 5 < 1.', a: ['x > 3 or x < -2'], type: 'multi', difficulty: 3 },
  ]},

  // ── linear-functions ────────────────────────────────────────────────────────
  'function-basics': { questions: [
    { q: 'What is a function?', a: 'a rule that assigns exactly one output to each input', type: 'short', difficulty: 1 },
    { q: 'In f(x) = 2x + 1, what is f(3)?', a: '7', type: 'calculation', difficulty: 1 },
    { q: 'True or false: A function can have two different outputs for the same input.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'What is the domain of a function?', a: 'the set of all possible input values', type: 'short', difficulty: 1 },
    { q: 'What is the range of a function?', a: 'the set of all possible output values', type: 'short', difficulty: 1 },
    { q: 'If g(x) = x^2 - 4, find g(5).', a: '21', type: 'calculation', difficulty: 2 },
    { q: 'Does the set {(1, 3), (2, 5), (3, 7), (1, 4)} represent a function? Explain.', a: 'no because the input 1 has two different outputs 3 and 4', type: 'open', difficulty: 2 },
    { q: 'How can you use the vertical line test to determine if a graph is a function?', a: 'if any vertical line crosses the graph more than once then it is not a function', type: 'short', difficulty: 3 },
  ]},
  'function-tables': { questions: [
    { q: 'Complete the table for y = 2x + 1 when x = 0, 1, 2, 3.', a: ['y = 1, 3, 5, 7', '1 3 5 7'], type: 'multi', difficulty: 1 },
    { q: 'A function table shows: x: 1, 2, 3, 4 and y: 5, 8, 11, 14. What is the rule?', a: ['y = 3x + 2'], type: 'multi', difficulty: 2 },
    { q: 'True or false: If the y-values in a table increase by the same amount each time, the function is linear.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'In a table for y = x + 4, what is y when x = -2?', a: '2', type: 'calculation', difficulty: 1 },
    { q: 'A table shows: x: 0, 1, 2, 3 and y: 3, 5, 7, 9. What is the rate of change?', a: '2', type: 'short', difficulty: 2 },
    { q: 'Write a function rule for a table where x: 1, 2, 3, 4 and y: 4, 7, 10, 13.', a: ['y = 3x + 1'], type: 'multi', difficulty: 2 },
    { q: 'How do you find the rate of change from a function table?', a: 'divide the change in y by the change in x between any two rows', type: 'short', difficulty: 2 },
    { q: 'A table shows: x: 0, 2, 4, 6 and y: -1, 5, 11, 17. Find the function rule.', a: ['y = 3x - 1'], type: 'multi', difficulty: 3 },
  ]},
  'slope': { questions: [
    { q: 'What is slope?', a: 'the measure of the steepness of a line or the rate of change', type: 'short', difficulty: 1 },
    { q: 'What is the formula for slope given two points?', a: ['m = (y2 - y1) / (x2 - x1)', 'rise over run'], type: 'multi', difficulty: 1 },
    { q: 'What is the slope of the line passing through (2, 3) and (4, 7)?', a: '2', type: 'calculation', difficulty: 1 },
    { q: 'True or false: A horizontal line has a slope of zero.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the slope of a vertical line?', a: 'undefined', type: 'short', difficulty: 2 },
    { q: 'Find the slope of the line through (-1, 4) and (3, -2).', a: ['-3/2', '-1.5'], type: 'multi', difficulty: 2 },
    { q: 'What does a negative slope tell you about a line?', a: 'the line goes down from left to right or the y-values decrease as x increases', type: 'short', difficulty: 2 },
    { q: 'A line passes through (0, 5) and (6, 5). What is the slope and what does this mean?', a: 'the slope is 0 which means the line is horizontal and y does not change', type: 'open', difficulty: 3 },
  ]},
  'slope-intercept-form': { questions: [
    { q: 'What is slope-intercept form?', a: 'y = mx + b where m is the slope and b is the y-intercept', type: 'short', difficulty: 1 },
    { q: 'Write the equation of a line with slope 3 and y-intercept -2.', a: ['y = 3x - 2'], type: 'multi', difficulty: 1 },
    { q: 'In the equation y = -2x + 5, what is the slope and what is the y-intercept?', a: 'the slope is -2 and the y-intercept is 5', type: 'short', difficulty: 1 },
    { q: 'True or false: In y = 4x, the y-intercept is 0.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Rewrite 2x + y = 7 in slope-intercept form.', a: ['y = -2x + 7'], type: 'multi', difficulty: 2 },
    { q: 'What is the y-intercept of the line 3x - 2y = 8?', a: ['-4', 'y-intercept is -4'], type: 'multi', difficulty: 2 },
    { q: 'A line has a slope of 1/2 and passes through the point (0, -3). Write the equation.', a: ['y = (1/2)x - 3', 'y = 0.5x - 3', 'y = x/2 - 3'], type: 'multi', difficulty: 2 },
    { q: 'Rewrite 4x - 2y + 6 = 0 in slope-intercept form and identify the slope and y-intercept.', a: 'y = 2x + 3 so slope is 2 and y-intercept is 3', type: 'short', difficulty: 3 },
  ]},
  'graphing-linear-equations': { questions: [
    { q: 'To graph y = 2x + 1, what point do you plot first?', a: ['the y-intercept (0, 1)', '(0, 1)'], type: 'multi', difficulty: 1 },
    { q: 'After plotting the y-intercept for y = 2x + 1, how do you use the slope to find the next point?', a: 'go up 2 and right 1 from the y-intercept', type: 'short', difficulty: 1 },
    { q: 'True or false: The graph of y = -x + 3 goes down from left to right.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Name two points on the line y = x - 4.', a: ['(0, -4) and (4, 0)', '(0, -4) and (1, -3)'], type: 'multi', difficulty: 2 },
    { q: 'Where does the line y = 3x - 6 cross the x-axis?', a: ['(2, 0)', 'x = 2'], type: 'multi', difficulty: 2 },
    { q: 'How many points do you need to draw a straight line?', a: '2', type: 'short', difficulty: 1 },
    { q: 'If two lines on a graph are parallel, what do you know about their slopes?', a: 'they have the same slope', type: 'short', difficulty: 2 },
    { q: 'Graph the equation y = -1/2 x + 4 by identifying the y-intercept and one other point using the slope.', a: 'y-intercept is (0, 4) and using slope -1/2 go down 1 and right 2 to get the point (2, 3)', type: 'open', difficulty: 3 },
  ]},
  'writing-linear-equations': { questions: [
    { q: 'Write the equation of a line with slope 4 that passes through (0, -1).', a: ['y = 4x - 1'], type: 'multi', difficulty: 1 },
    { q: 'Write the equation of a line through (0, 3) and (2, 7).', a: ['y = 2x + 3'], type: 'multi', difficulty: 1 },
    { q: 'True or false: If you know the slope and one point on a line, you can write the equation.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Write the equation of a line with slope -3 that passes through (1, 2).', a: ['y = -3x + 5'], type: 'multi', difficulty: 2 },
    { q: 'Write the equation of a line through (2, 1) and (4, 5).', a: ['y = 2x - 3'], type: 'multi', difficulty: 2 },
    { q: 'A plumber charges $50 for a house call plus $30 per hour. Write the equation relating total cost C to hours h.', a: ['C = 30h + 50'], type: 'multi', difficulty: 2 },
    { q: 'Write the equation of a horizontal line that passes through (5, -2).', a: ['y = -2'], type: 'multi', difficulty: 2 },
    { q: 'Write the equation of a line through (-3, 4) and (3, -2). Then find where it crosses the x-axis.', a: 'y = -x + 1 and it crosses the x-axis at (1, 0)', type: 'open', difficulty: 3 },
  ]},

  // ── systems-advanced ────────────────────────────────────────────────────────
  'systems-of-equations': { questions: [
    { q: 'What is a system of equations?', a: 'two or more equations with the same variables that you solve at the same time', type: 'short', difficulty: 1 },
    { q: 'Solve by substitution: y = x + 2 and y = 3x.', a: ['x = 1, y = 3', '(1, 3)'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A system of equations can have exactly one solution, no solution, or infinitely many solutions.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Solve: x + y = 10 and x - y = 4.', a: ['x = 7, y = 3', '(7, 3)'], type: 'multi', difficulty: 2 },
    { q: 'What does it mean graphically if a system of two linear equations has no solution?', a: 'the lines are parallel and never intersect', type: 'short', difficulty: 2 },
    { q: 'Solve by substitution: y = 2x - 1 and 3x + y = 14.', a: ['x = 3, y = 5', '(3, 5)'], type: 'multi', difficulty: 2 },
    { q: 'A coffee shop sells small coffees for $2 and large coffees for $3. In one hour, 20 coffees were sold for $48. How many of each size were sold?', a: ['12 small and 8 large', 's = 12, l = 8'], type: 'multi', difficulty: 3 },
    { q: 'Solve by elimination: 2x + 3y = 12 and 2x - y = 4.', a: ['x = 3, y = 2', '(3, 2)'], type: 'multi', difficulty: 3 },
  ]},
  'exponent-expressions': { questions: [
    { q: 'What does x^3 mean?', a: 'x multiplied by itself 3 times or x times x times x', type: 'short', difficulty: 1 },
    { q: 'Simplify: x^2 * x^3.', a: 'x^5', type: 'short', difficulty: 1 },
    { q: 'True or false: 2^3 = 6.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Simplify: (x^3)^2.', a: 'x^6', type: 'short', difficulty: 2 },
    { q: 'What is any number raised to the power of 0?', a: '1', type: 'short', difficulty: 1 },
    { q: 'Simplify: (2x)^3.', a: '8x^3', type: 'short', difficulty: 2 },
    { q: 'Simplify: x^5 / x^2.', a: 'x^3', type: 'short', difficulty: 2 },
    { q: 'Simplify: (3a^2b)^2.', a: '9a^4b^2', type: 'short', difficulty: 3 },
  ]},
  'polynomials-intro': { questions: [
    { q: 'What is a polynomial?', a: 'an expression with one or more terms where each term has a variable raised to a whole number exponent', type: 'short', difficulty: 1 },
    { q: 'What is the degree of the polynomial 3x^2 + 5x - 7?', a: '2', type: 'short', difficulty: 1 },
    { q: 'True or false: 4x^3 - 2x + 1 is a trinomial.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Add: (2x^2 + 3x) + (x^2 - 5x + 4).', a: '3x^2 - 2x + 4', type: 'short', difficulty: 2 },
    { q: 'Subtract: (5x^2 + 2x - 1) - (3x^2 - x + 4).', a: '2x^2 + 3x - 5', type: 'short', difficulty: 2 },
    { q: 'What is the leading coefficient of 7x^3 - 4x^2 + x?', a: '7', type: 'short', difficulty: 2 },
    { q: 'Classify 5x^2 - 3x + 1 by the number of terms and its degree.', a: 'it is a second-degree trinomial or quadratic trinomial', type: 'short', difficulty: 2 },
    { q: 'Simplify: (4x^3 + x^2 - 3) + (2x^3 - 5x^2 + x + 7).', a: '6x^3 - 4x^2 + x + 4', type: 'short', difficulty: 3 },
  ]},
  'quadratic-intro': { questions: [
    { q: 'What is a quadratic expression?', a: 'a polynomial with a degree of 2 with the general form ax^2 + bx + c', type: 'short', difficulty: 1 },
    { q: 'What shape is the graph of a quadratic function?', a: ['parabola', 'a parabola', 'U-shape'], type: 'multi', difficulty: 1 },
    { q: 'True or false: The graph of y = x^2 opens upward.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'In y = x^2 - 4, what is the value of y when x = 0?', a: '-4', type: 'calculation', difficulty: 1 },
    { q: 'What is the vertex of the parabola y = x^2?', a: ['(0, 0)', 'the origin'], type: 'multi', difficulty: 2 },
    { q: 'If a in y = ax^2 is negative, which way does the parabola open?', a: 'downward', type: 'short', difficulty: 2 },
    { q: 'Factor: x^2 + 5x + 6.', a: '(x + 2)(x + 3)', type: 'short', difficulty: 3 },
    { q: 'A ball is thrown upward and its height is modeled by h = -5t^2 + 20t. At what time does it reach its maximum height?', a: ['t = 2 seconds', '2 seconds', '2'], type: 'multi', difficulty: 3 },
  ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// HINT BANKS — 3-tier progressive hints per skill
// ═══════════════════════════════════════════════════════════════════════════════

const HINT_BANKS = {
  // expressions
  'variables-constants': { tier1: 'Variables are letters that stand for unknown values. Constants are plain numbers.', tier2: 'In 3x + 7, the "x" can change (variable) and 7 stays the same (constant). The 3 is a coefficient — it multiplies the variable.', tier3: 'Example: In 5a + 2b - 9, the variables are a and b, the constants are -9, and the coefficients are 5 and 2.' },
  'evaluating-expressions': { tier1: 'Replace the variable with the given number, then calculate.', tier2: 'Plug in the value and follow the order of operations (PEMDAS). Parentheses first, then exponents, then multiply/divide, then add/subtract.', tier3: 'Example: Evaluate 3x + 2 when x = 4 → 3(4) + 2 = 12 + 2 = 14.' },
  'simplifying-expressions': { tier1: 'Look for like terms — terms with the same variable and exponent.', tier2: 'Add or subtract the coefficients of like terms. Keep the variable and exponent the same.', tier3: 'Example: 3x + 5x = 8x. But 3x + 5y stays as 3x + 5y because x and y are different variables.' },
  'distributive-property': { tier1: 'Multiply the outside number by each term inside the parentheses.', tier2: 'a(b + c) = ab + ac. Don\'t forget the sign: a negative times a negative is positive.', tier3: 'Example: 3(x + 4) = 3·x + 3·4 = 3x + 12. And -2(x - 5) = -2x + 10.' },
  'combining-like-terms': { tier1: 'Like terms have the same variable(s) with the same exponent(s).', tier2: 'Group the like terms together, then add their coefficients. Constants are like terms with each other.', tier3: 'Example: 2x^2 + 5x + 3x^2 - x = (2x^2 + 3x^2) + (5x - x) = 5x^2 + 4x.' },

  // equations
  'one-step-equations': { tier1: 'Do the opposite operation to isolate the variable. Undo addition with subtraction, and vice versa.', tier2: 'Whatever you do to one side, you must do to the other side to keep the equation balanced.', tier3: 'Example: x + 5 = 12 → subtract 5 from both sides → x = 7. Check: 7 + 5 = 12. ✓' },
  'two-step-equations': { tier1: 'First undo addition or subtraction, then undo multiplication or division.', tier2: 'Reverse the order of operations: undo + or - first, then undo × or ÷.', tier3: 'Example: 2x + 3 = 11 → subtract 3 → 2x = 8 → divide by 2 → x = 4.' },
  'multi-step-equations': { tier1: 'Simplify each side first (distribute, combine like terms), then solve.', tier2: 'Step 1: Distribute. Step 2: Combine like terms. Step 3: Isolate the variable using inverse operations.', tier3: 'Example: 3(x + 2) = 21 → 3x + 6 = 21 → 3x = 15 → x = 5.' },
  'equations-with-variables-both-sides': { tier1: 'Get all variables on one side and all constants on the other side.', tier2: 'Subtract the smaller variable term from both sides first, then solve like a regular equation.', tier3: 'Example: 5x + 2 = 3x + 10 → subtract 3x → 2x + 2 = 10 → 2x = 8 → x = 4.' },
  'word-problems-equations': { tier1: 'Read carefully. Define a variable. Translate words into math.', tier2: '"Is" means =. "More than" means +. "Less than" means -. "Times" or "of" means ×. "Per" means ÷ or ×.', tier3: 'Example: "A number doubled plus 3 is 17" → 2x + 3 = 17 → 2x = 14 → x = 7.' },

  // inequalities
  'inequality-basics': { tier1: 'Inequalities are like equations but with <, >, ≤, or ≥ instead of =.', tier2: '> means greater than, < means less than, ≥ means greater than or equal to, ≤ means less than or equal to.', tier3: 'Example: "x is at least 5" means x ≥ 5. "x is less than 10" means x < 10.' },
  'solving-inequalities': { tier1: 'Solve just like an equation, but watch out for multiplying or dividing by a negative.', tier2: 'When you multiply or divide both sides by a negative number, flip the inequality symbol.', tier3: 'Example: -3x > 12 → divide by -3 and flip → x < -4.' },
  'graphing-inequalities': { tier1: 'Open circle = not included (< or >). Closed circle = included (≤ or ≥).', tier2: 'Draw the circle at the boundary number. Shade right for > or ≥, shade left for < or ≤.', tier3: 'Example: x > 3 → open circle at 3, shade right. x ≤ 5 → closed circle at 5, shade left.' },
  'compound-inequalities': { tier1: '"AND" means both must be true (overlap). "OR" means either can be true (union).', tier2: 'For AND, solve both parts and find where they overlap. For OR, solve both parts and combine all solutions.', tier3: 'Example: 2 < x + 1 < 6 → subtract 1 from all three parts → 1 < x < 5.' },

  // linear-functions
  'function-basics': { tier1: 'A function is like a machine: put in a number, get out a number. Each input gives exactly one output.', tier2: 'f(x) = 2x + 1 means plug x into 2x + 1 to get the output. f(3) = 2(3) + 1 = 7.', tier3: 'Example: If f(x) = x^2 - 4, then f(5) = 25 - 4 = 21. Each x gives exactly one y.' },
  'function-tables': { tier1: 'Look for a pattern in how y changes as x changes.', tier2: 'Find the rate of change: (change in y) / (change in x). Then find the starting value when x = 0.', tier3: 'Example: x: 0, 1, 2, 3 and y: 3, 5, 7, 9. Rate of change = 2. Starting value (x=0) = 3. Rule: y = 2x + 3.' },
  'slope': { tier1: 'Slope = rise / run = (change in y) / (change in x).', tier2: 'Use (y₂ - y₁) / (x₂ - x₁). Positive slope goes up, negative slope goes down, zero slope is flat, undefined slope is vertical.', tier3: 'Example: Points (2, 3) and (4, 7) → slope = (7 - 3) / (4 - 2) = 4 / 2 = 2.' },
  'slope-intercept-form': { tier1: 'y = mx + b. The m is the slope and b is where the line crosses the y-axis.', tier2: 'To convert to slope-intercept form, solve for y. Get y alone on one side.', tier3: 'Example: Slope 3, y-intercept -2 → y = 3x - 2. For 2x + y = 7 → y = -2x + 7.' },
  'graphing-linear-equations': { tier1: 'Start by plotting the y-intercept (0, b). Then use the slope to find more points.', tier2: 'Slope m = rise/run. From the y-intercept, go up "rise" and right "run" to plot the next point. Connect with a straight line.', tier3: 'Example: y = 2x + 1. Plot (0, 1). Slope = 2/1, so go up 2, right 1 to (1, 3). Draw the line.' },
  'writing-linear-equations': { tier1: 'If you have the slope and y-intercept, plug into y = mx + b.', tier2: 'If you have two points, find slope first, then use one point to find b.', tier3: 'Example: Through (2, 7) and (4, 11). Slope = (11 - 7)/(4 - 2) = 2. Then 7 = 2(2) + b → b = 3. Equation: y = 2x + 3.' },

  // systems-advanced
  'systems-of-equations': { tier1: 'You need two equations to find two unknowns. Use substitution or elimination.', tier2: 'Substitution: Solve one equation for a variable, plug it into the other. Elimination: Add or subtract equations to cancel a variable.', tier3: 'Example: y = x + 2 and y = 3x. Substitute: x + 2 = 3x → 2 = 2x → x = 1, y = 3.' },
  'exponent-expressions': { tier1: 'An exponent tells how many times to multiply the base by itself.', tier2: 'Product rule: x^a · x^b = x^(a+b). Power rule: (x^a)^b = x^(ab). Quotient rule: x^a / x^b = x^(a-b).', tier3: 'Example: x^2 · x^3 = x^(2+3) = x^5. (x^3)^2 = x^(3·2) = x^6.' },
  'polynomials-intro': { tier1: 'A polynomial is a sum of terms with variables raised to whole-number powers.', tier2: 'To add or subtract polynomials, combine like terms. Degree = highest exponent.', tier3: 'Example: (2x^2 + 3x) + (x^2 - 5x + 4) = 3x^2 - 2x + 4. Degree is 2.' },
  'quadratic-intro': { tier1: 'Quadratics have the form ax^2 + bx + c. The graph is a parabola.', tier2: 'If a > 0 the parabola opens up; if a < 0 it opens down. The vertex is the highest or lowest point.', tier3: 'Example: y = x^2 - 4. It opens up, vertex at (0, -4). When x = 2, y = 0. When x = -2, y = 0.' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MISCONCEPTIONS — pattern-matched corrections per skill
// ═══════════════════════════════════════════════════════════════════════════════

const MISCONCEPTIONS = {
  'variables-constants': [
    { patterns: [/variable.*number|variable.*constant|variable.*same.*constant/i], correction: 'A variable is NOT a number — it is a letter or symbol that represents an unknown or changing value. A constant is a fixed number. In 3x + 7, x is the variable (it can be any value) and 7 is the constant (it never changes).' },
  ],
  'evaluating-expressions': [
    { patterns: [/3x.*34|multiply.*wrong|forgot.*order/i], correction: 'Remember to use the order of operations (PEMDAS). When evaluating 3x + 2 at x = 4, first compute 3 × 4 = 12, then add 2 to get 14. Don\'t concatenate — 3x means 3 times x, not "3" followed by "x".' },
  ],
  'simplifying-expressions': [
    { patterns: [/3x.*4y.*7xy|add.*different.*variables|combine.*unlike/i], correction: 'You CANNOT combine unlike terms. 3x + 4y stays as 3x + 4y because x and y are different variables. You can only combine terms with the same variable and the same exponent.' },
  ],
  'distributive-property': [
    { patterns: [/2\(x.*5\).*2x.*5|forgot.*distribute.*second|only.*multiply.*first/i], correction: 'You must distribute to EVERY term inside the parentheses, not just the first. 2(x + 5) = 2·x + 2·5 = 2x + 10, NOT 2x + 5.' },
  ],
  'combining-like-terms': [
    { patterns: [/x\^2.*same.*x|x.*squared.*like.*x/i], correction: 'x^2 and x are NOT like terms because they have different exponents. Like terms must have the same variable(s) raised to the same power(s). 4x^2 + 3x cannot be simplified further.' },
  ],
  'one-step-equations': [
    { patterns: [/add.*both.*side.*wrong|same.*side|forgot.*both.*sides/i], correction: 'Whatever you do to one side of the equation, you MUST do to the other side. To solve x + 5 = 12, subtract 5 from BOTH sides: x + 5 - 5 = 12 - 5, so x = 7.' },
  ],
  'two-step-equations': [
    { patterns: [/divide.*first|multiply.*first.*before.*subtract/i], correction: 'In a two-step equation like 2x + 3 = 11, undo the addition or subtraction FIRST, then undo the multiplication or division. First subtract 3 to get 2x = 8, then divide by 2 to get x = 4. Work in reverse order of operations.' },
  ],
  'multi-step-equations': [
    { patterns: [/forgot.*distribute|didn.*distribute|no.*distribute/i], correction: 'Don\'t forget to distribute before combining like terms. For example, in 3(x + 2) = 21, you must first distribute: 3x + 6 = 21, then solve: 3x = 15, x = 5.' },
  ],
  'equations-with-variables-both-sides': [
    { patterns: [/subtract.*wrong.*side|variables.*same.*side.*wrong/i], correction: 'When variables appear on both sides, move all variable terms to ONE side and all constant terms to the OTHER side. For 5x + 2 = 3x + 10, subtract 3x from both sides to get 2x + 2 = 10.' },
  ],
  'inequality-basics': [
    { patterns: [/inequality.*same.*equation|inequality.*one.*answer/i], correction: 'An inequality is NOT the same as an equation. An equation has one solution (or sometimes none or infinitely many), but an inequality typically has infinitely many solutions — a whole range of values that make it true.' },
  ],
  'solving-inequalities': [
    { patterns: [/didn.*flip|forgot.*flip|no.*flip.*negative/i], correction: 'When you multiply or divide both sides of an inequality by a NEGATIVE number, you MUST flip the inequality sign. For -3x > 12: dividing by -3 flips > to <, so x < -4.' },
  ],
  'slope': [
    { patterns: [/slope.*x.*over.*y|run.*over.*rise|horizontal.*over.*vertical/i], correction: 'Slope = rise / run = (change in y) / (change in x), NOT the other way around. Rise is vertical (y), run is horizontal (x). Remember: "rise over run."' },
  ],
  'slope-intercept-form': [
    { patterns: [/b.*is.*slope|m.*is.*intercept|mixed.*up.*m.*b/i], correction: 'In y = mx + b, m is the SLOPE (rate of change) and b is the Y-INTERCEPT (where the line crosses the y-axis). Don\'t mix them up! m controls steepness, b controls where the line starts on the y-axis.' },
  ],
  'systems-of-equations': [
    { patterns: [/one.*equation.*two.*variable|can.*solve.*one.*equation/i], correction: 'You need TWO equations to solve for TWO unknowns. A single equation like x + y = 10 has infinitely many solutions. You need a second equation (like x - y = 4) to narrow it down to one answer.' },
  ],
  'exponent-expressions': [
    { patterns: [/x\^2.*x\^3.*x\^6|multiply.*exponents.*when.*multiply/i], correction: 'When multiplying like bases, ADD the exponents, don\'t multiply them. x^2 × x^3 = x^(2+3) = x^5, NOT x^6. You only multiply exponents with the power rule: (x^2)^3 = x^(2×3) = x^6.' },
  ],
  'polynomials-intro': [
    { patterns: [/add.*exponents|combine.*different.*degree/i], correction: 'When adding polynomials, you do NOT add the exponents. You combine LIKE TERMS (same variable, same exponent). (2x^2 + 3x) + (x^2 - 5x) = 3x^2 - 2x. The exponents stay the same.' },
  ],
  'quadratic-intro': [
    { patterns: [/parabola.*straight|quadratic.*line|x\^2.*linear/i], correction: 'A quadratic function produces a PARABOLA (curved shape), NOT a straight line. The x^2 term creates the curve. Only linear functions (degree 1) produce straight lines.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHENOMENA — driving questions for phenomenon-based learning
// ═══════════════════════════════════════════════════════════════════════════════

const PHENOMENA = {
  'expressions': [
    { title: 'Cell Phone Plan Comparison', focus: 'variables, expressions, evaluating', text: 'Plan A charges $30 per month plus $0.05 per text message. Plan B charges $45 per month with unlimited texting. A student sends about 400 texts per month.', drivingQuestion: 'Write an expression for the monthly cost of each plan. For what number of texts are the two plans equal in cost? Which plan is better for this student?' },
    { title: 'Recipe Scaling', focus: 'variables, coefficients, evaluating expressions', text: 'A cookie recipe calls for 2 cups of flour, 1 cup of sugar, and 0.5 cups of butter for one batch. A bakery needs to scale the recipe for different order sizes.', drivingQuestion: 'Write expressions for the amount of each ingredient needed for b batches. If the bakery needs 7 batches, how much of each ingredient is needed?' },
  ],
  'equations': [
    { title: 'Movie Ticket Pricing', focus: 'equations, word problems', text: 'A movie theater charges $12 per ticket. On Tuesdays, tickets are discounted by $4 each, and every customer gets a $2 off coupon. A family paid $56 on a Tuesday using coupons.', drivingQuestion: 'Write and solve an equation to find how many tickets the family bought. How much would the same number of tickets cost at full price?' },
    { title: 'Saving for a Bicycle', focus: 'two-step equations, word problems', text: 'Jamal wants to buy a bicycle that costs $240. He already has $60 saved and earns $15 per hour mowing lawns.', drivingQuestion: 'Write an equation to find how many hours Jamal needs to work. What if the bicycle goes on sale for 20% off — how does the equation change?' },
  ],
  'inequalities': [
    { title: 'Amusement Park Budget', focus: 'inequalities, real-world constraints', text: 'A student has $50 to spend at an amusement park. Admission is $20 and each ride costs $3. The student wants to go on as many rides as possible.', drivingQuestion: 'Write and solve an inequality for the number of rides the student can afford. What is the maximum number of rides? How would a $5 food purchase change the answer?' },
    { title: 'Speed Limits and Travel Time', focus: 'inequalities, rates', text: 'A driver needs to travel 180 miles to visit family. The speed limit varies from 55 mph to 70 mph on different parts of the highway.', drivingQuestion: 'Write inequalities to express the minimum and maximum travel times. If the driver must arrive in less than 3 hours, is it possible while obeying the speed limit?' },
  ],
  'linear-functions': [
    { title: 'Water Tank Filling', focus: 'slope, linear functions, graphing', text: 'A water tank starts with 50 gallons and is being filled at a rate of 8 gallons per minute. A second tank starts with 200 gallons and is draining at 6 gallons per minute.', drivingQuestion: 'Write equations for the amount of water in each tank over time. Graph both lines on the same coordinate plane. When will the tanks have the same amount of water?' },
    { title: 'Streaming Service Growth', focus: 'linear functions, slope, interpretation', text: 'A new streaming service launched with 2 million subscribers. Each month it gains about 500,000 new subscribers. A competitor started with 8 million subscribers and loses about 200,000 per month.', drivingQuestion: 'Write linear functions for each service. When will they have the same number of subscribers? What do the slopes tell you about each company?' },
  ],
  'systems-advanced': [
    { title: 'School Fundraiser', focus: 'systems of equations', text: 'A school sells candy bars for $2 and popcorn bags for $3 at a fundraiser. They sold 150 total items and collected $370. The principal wants to know how many of each item were sold.', drivingQuestion: 'Set up and solve a system of equations to find how many candy bars and how many popcorn bags were sold. Verify your answer.' },
    { title: 'Rocket Launch', focus: 'quadratics, parabolas', text: 'A model rocket is launched upward from the ground. Its height in feet after t seconds is modeled by h = -16t^2 + 96t.', drivingQuestion: 'What is the maximum height of the rocket and when does it reach it? When does the rocket return to the ground? Sketch the height vs. time graph.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// LESSONS — structured lesson plans for each category
// ═══════════════════════════════════════════════════════════════════════════════

const LESSONS = {
  'expressions': {
    title: 'Introduction to Algebraic Expressions',
    objective: 'Students will identify variables, constants, and coefficients. Students will evaluate and simplify expressions using the distributive property and combining like terms.',
    warmUp: 'Write three mathematical expressions that describe everyday situations (e.g., total cost = price × quantity + tax).',
    keyVocabulary: ['variable', 'constant', 'coefficient', 'term', 'expression', 'like terms', 'distributive property'],
    activities: [
      'Sort cards with terms, variables, and constants into categories.',
      'Evaluate expressions for given values using substitution.',
      'Practice distributing and combining like terms with partner problems.',
    ],
    closingQuestion: 'How are algebraic expressions useful for describing real-world patterns?',
  },
  'equations': {
    title: 'Solving Equations Step by Step',
    objective: 'Students will solve one-step, two-step, and multi-step equations. Students will translate word problems into equations and verify solutions.',
    warmUp: 'What does it mean for a value to be the "solution" to an equation? Give an example.',
    keyVocabulary: ['equation', 'solution', 'inverse operation', 'isolate', 'balance', 'verify'],
    activities: [
      'Use a balance scale model to demonstrate solving one-step equations.',
      'Progress through solving two-step and multi-step equations with guided practice.',
      'Translate word problems into equations and solve in small groups.',
    ],
    closingQuestion: 'Why is it important to check (verify) your solution after solving an equation?',
  },
  'inequalities': {
    title: 'Understanding and Solving Inequalities',
    objective: 'Students will write, solve, and graph inequalities on a number line. Students will understand and solve compound inequalities.',
    warmUp: 'Name a real-life situation where there is a range of acceptable values rather than one exact answer.',
    keyVocabulary: ['inequality', 'greater than', 'less than', 'open circle', 'closed circle', 'compound inequality'],
    activities: [
      'Compare inequalities and equations — discuss how many solutions each has.',
      'Practice solving inequalities, focusing on when to flip the sign.',
      'Graph solutions on number lines and write compound inequalities for real scenarios.',
    ],
    closingQuestion: 'When solving inequalities, why must we flip the sign when multiplying or dividing by a negative?',
  },
  'linear-functions': {
    title: 'Linear Functions and Their Graphs',
    objective: 'Students will understand functions, create input-output tables, calculate slope, and graph linear equations in slope-intercept form.',
    warmUp: 'Give an example of a real-world relationship where one quantity depends on another (e.g., distance depends on time).',
    keyVocabulary: ['function', 'domain', 'range', 'slope', 'y-intercept', 'slope-intercept form', 'rate of change'],
    activities: [
      'Build function tables and identify patterns in the rate of change.',
      'Calculate slope from tables, graphs, and pairs of points.',
      'Graph lines using slope-intercept form and interpret slope and y-intercept in context.',
    ],
    closingQuestion: 'How does slope describe the relationship between two changing quantities?',
  },
  'systems-advanced': {
    title: 'Systems of Equations and Beyond',
    objective: 'Students will solve systems of equations by substitution and elimination. Students will explore exponents, polynomials, and introductory quadratics.',
    warmUp: 'If you know x + y = 10 but nothing else, can you find x and y? What additional information would you need?',
    keyVocabulary: ['system of equations', 'substitution', 'elimination', 'exponent', 'polynomial', 'quadratic', 'parabola'],
    activities: [
      'Solve systems using substitution and elimination with partner practice.',
      'Explore exponent rules through pattern discovery.',
      'Investigate quadratic functions and parabolas using graphing activities.',
    ],
    closingQuestion: 'Why do we need two equations to solve for two unknowns? What happens if we only have one equation?',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL LABS — PhET simulation activities
// ═══════════════════════════════════════════════════════════════════════════════

const VIRTUAL_LABS = {
  'equality-explorer': {
    title: 'Virtual Equality Explorer Lab',
    skills: ['one-step-equations', 'two-step-equations', 'equations-with-variables-both-sides'],
    objective: 'Use a virtual balance to explore how equations work and develop strategies for solving them',
    background: 'An equation is like a balance — both sides must be equal. To solve for an unknown, you must keep the balance by performing the same operation on both sides.',
    hypothesis_prompt: 'Predict: If you add a weight to one side of a balance, what must you do to keep it balanced? How does this relate to solving equations?',
    variables: { independent: 'operations performed on the equation', dependent: 'value of the unknown variable', controlled: ['starting equation', 'balance model'] },
    procedure: [
      { step: 1, action: 'Start with the equation x + 3 = 7. Place blocks on the balance to represent each side. Find the value of x that makes it balance.' },
      { step: 2, action: 'Try the equation 2x = 8. Use the balance to understand why dividing both sides by 2 works.' },
      { step: 3, action: 'Explore 3x + 2 = 11. First remove the constant (subtract 2 from both sides), then divide.' },
      { step: 4, action: 'Challenge: Set up 5x + 1 = 3x + 9. Move variable blocks to one side and constant blocks to the other.' },
      { step: 5, action: 'Create your own equation, set it up on the balance, and solve it step by step.' },
    ],
    observations: {
      'one-step-add': 'x + 3 = 7: Remove 3 from both sides. Left side: x. Right side: 4. So x = 4. Check: 4 + 3 = 7. ✓',
      'one-step-multiply': '2x = 8: Split both sides into 2 equal groups. Each group of x = 4. So x = 4. Check: 2(4) = 8. ✓',
      'two-step': '3x + 2 = 11: Remove 2 from both sides → 3x = 9. Split into 3 groups → x = 3. Check: 3(3) + 2 = 11. ✓',
      'variables-both-sides': '5x + 1 = 3x + 9: Remove 3x from both sides → 2x + 1 = 9. Remove 1 → 2x = 8. Divide → x = 4. Check: 5(4)+1 = 21 = 3(4)+9. ✓',
    },
    data_table: {
      columns: ['Equation', 'Step 1', 'Step 2', 'Solution', 'Check'],
      rows: [
        ['x + 3 = 7', 'Subtract 3', '—', 'x = 4', '4 + 3 = 7 ✓'],
        ['2x = 8', 'Divide by 2', '—', 'x = 4', '2(4) = 8 ✓'],
        ['3x + 2 = 11', 'Subtract 2 → 3x = 9', 'Divide by 3', 'x = 3', '3(3)+2 = 11 ✓'],
        ['5x + 1 = 3x + 9', 'Subtract 3x → 2x+1=9', 'Sub 1, div 2', 'x = 4', '5(4)+1 = 3(4)+9 ✓'],
      ],
    },
    conclusion_questions: [
      'Why must you perform the same operation on both sides of an equation?',
      'In a two-step equation, why do you undo addition/subtraction before multiplication/division?',
      'What did you observe when solving equations with variables on both sides?',
      'Create an equation that has no solution. How does it look on the balance?',
      'How does the balance model help you understand the concept of "isolating the variable"?',
    ],
  },
  'function-builder': {
    title: 'Virtual Function Builder Lab',
    skills: ['function-basics', 'function-tables', 'evaluating-expressions'],
    objective: 'Build and explore functions using input-output machines to understand the concept of a function rule',
    background: 'A function is a rule that takes each input and produces exactly one output. By observing patterns in input-output pairs, we can discover the rule.',
    hypothesis_prompt: 'Predict: If a function machine doubles every input and adds 1, what is the output when the input is 5? What would be the rule?',
    variables: { independent: 'input values (x)', dependent: 'output values (y)', controlled: ['function rule'] },
    procedure: [
      { step: 1, action: 'Enter inputs 0, 1, 2, 3, 4 into Function Machine A (rule: y = 2x + 1). Record the outputs.' },
      { step: 2, action: 'Enter inputs 0, 1, 2, 3, 4 into Function Machine B (rule: y = 3x - 2). Record the outputs.' },
      { step: 3, action: 'Enter inputs 0, 1, 2, 3, 4 into Mystery Machine C. Record outputs and guess the rule.' },
      { step: 4, action: 'Enter inputs 0, 1, 2, 3, 4 into Mystery Machine D. Record outputs and guess the rule.' },
      { step: 5, action: 'Create your own function rule. Have a partner guess it from the input-output pairs.' },
    ],
    observations: {
      'machine-A': 'Machine A (y = 2x + 1): Inputs 0→1, 1→3, 2→5, 3→7, 4→9. Pattern: outputs increase by 2 each time. Starts at 1.',
      'machine-B': 'Machine B (y = 3x - 2): Inputs 0→-2, 1→1, 2→4, 3→7, 4→10. Pattern: outputs increase by 3 each time. Starts at -2.',
      'mystery-C': 'Mystery Machine C: Inputs 0→4, 1→6, 2→8, 3→10, 4→12. Pattern: increases by 2, starts at 4. Rule: y = 2x + 4.',
      'mystery-D': 'Mystery Machine D: Inputs 0→-1, 1→3, 2→7, 3→11, 4→15. Pattern: increases by 4, starts at -1. Rule: y = 4x - 1.',
    },
    data_table: {
      columns: ['Machine', 'x = 0', 'x = 1', 'x = 2', 'x = 3', 'x = 4', 'Rate of Change', 'Rule'],
      rows: [
        ['A', '1', '3', '5', '7', '9', '2', 'y = 2x + 1'],
        ['B', '-2', '1', '4', '7', '10', '3', 'y = 3x - 2'],
        ['C', '4', '6', '8', '10', '12', '2', 'y = 2x + 4'],
        ['D', '-1', '3', '7', '11', '15', '4', 'y = 4x - 1'],
      ],
    },
    conclusion_questions: [
      'How can you determine the rate of change (slope) from a function table?',
      'How does the output when x = 0 relate to the equation y = mx + b?',
      'If two functions have the same rate of change but different starting values, how do their graphs compare?',
      'Can every pattern in a function table be described by y = mx + b? Why or why not?',
      'Describe a real-world situation that could be modeled by one of the function rules you discovered.',
    ],
  },
  'graphing-lines': {
    title: 'Virtual Graphing Lines Lab',
    skills: ['slope', 'slope-intercept-form', 'graphing-linear-equations', 'writing-linear-equations'],
    objective: 'Explore the relationship between a linear equation and its graph by manipulating slope and y-intercept',
    background: 'Every linear equation y = mx + b produces a straight line on a coordinate plane. The slope m controls the steepness and direction, while the y-intercept b controls where the line crosses the y-axis.',
    hypothesis_prompt: 'Predict: How will the graph of y = 2x + 1 look different from y = 2x + 4? How about y = 2x + 1 vs. y = -2x + 1?',
    variables: { independent: 'slope (m) and y-intercept (b)', dependent: 'graph of the line', controlled: ['coordinate plane scale', 'graphing method'] },
    procedure: [
      { step: 1, action: 'Graph y = x (slope 1, intercept 0). Then graph y = 2x and y = 3x on the same plane. How does increasing slope affect the line?' },
      { step: 2, action: 'Graph y = 2x + 1, y = 2x + 3, and y = 2x - 2 on the same plane. How does changing the y-intercept affect the line?' },
      { step: 3, action: 'Graph y = x and y = -x. What do you notice about lines with opposite slopes?' },
      { step: 4, action: 'Given the graph of a line that passes through (0, 3) and (2, 7), find the slope and write the equation.' },
      { step: 5, action: 'Challenge: Graph two lines that intersect at the point (2, 5). What equations did you use?' },
    ],
    observations: {
      'slope-effect': 'Increasing the slope makes the line steeper. y = x has slope 1 (45°), y = 2x is steeper, y = 3x is steepest. All pass through the origin.',
      'intercept-effect': 'Changing the y-intercept shifts the line up or down but keeps the same steepness. y = 2x + 1, y = 2x + 3, y = 2x - 2 are all parallel.',
      'negative-slope': 'y = x goes up from left to right. y = -x goes down from left to right. They form a V-shape (or X) at the origin. Opposite slopes create lines that are reflections over the x-axis.',
      'find-equation': 'Line through (0, 3) and (2, 7): slope = (7-3)/(2-0) = 4/2 = 2. Y-intercept = 3. Equation: y = 2x + 3.',
      'intersection': 'Many possible answers. Example: y = x + 3 and y = -x + 7 both pass through (2, 5). 2 + 3 = 5 ✓ and -2 + 7 = 5 ✓.',
    },
    data_table: {
      columns: ['Equation', 'Slope', 'Y-intercept', 'Direction', 'Steepness'],
      rows: [
        ['y = x', '1', '0', 'Up-right', 'Moderate'],
        ['y = 2x', '2', '0', 'Up-right', 'Steep'],
        ['y = 3x', '3', '0', 'Up-right', 'Very steep'],
        ['y = 2x + 1', '2', '1', 'Up-right', 'Steep'],
        ['y = 2x + 3', '2', '3', 'Up-right', 'Steep'],
        ['y = 2x - 2', '2', '-2', 'Up-right', 'Steep'],
        ['y = -x', '-1', '0', 'Down-right', 'Moderate'],
      ],
    },
    conclusion_questions: [
      'What effect does changing the slope have on the graph of a line?',
      'What effect does changing the y-intercept have on the graph?',
      'Two lines have the same slope but different y-intercepts. Will they ever intersect? Why or why not?',
      'How can you tell from looking at a graph whether the slope is positive, negative, or zero?',
      'If you know a line passes through two points, describe how to find its equation.',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGRAMS — coordinate plane and algebra diagrams
// ═══════════════════════════════════════════════════════════════════════════════

const DIAGRAMS_LOCAL = {
  'coordinate-plane-basics': {
    domain: 'ms-math-algebra',
    skill: 'graphing-linear-equations',
    topic: 'The Coordinate Plane',
    description: 'A coordinate plane with labeled axes and quadrants for students to identify.',
    diagram: `
         y
     [B] |  [A]
   ------+------→ x
     [C] |  [D]

  Quadrant [A]: _______________
  Quadrant [B]: _______________
  Quadrant [C]: _______________
  Quadrant [D]: _______________
  What are the coordinates of the origin? ___
`,
    labels: { A: 'Quadrant I (x positive y positive)', B: 'Quadrant II (x negative y positive)', C: 'Quadrant III (x negative y negative)', D: 'Quadrant IV (x positive y negative)', 'origin': '(0, 0)' },
  },
  'slope-intercept-graph': {
    domain: 'ms-math-algebra',
    skill: 'slope-intercept-form',
    topic: 'Reading Slope and Y-intercept from a Graph',
    description: 'A linear graph for students to identify the slope and y-intercept.',
    diagram: `
  y
  8 |          .
  6 |        .
  4 |      . [B]
  2 |    .
  0 +--. [A]-----→ x
 -2 |. 0  1  2  3  4
    |

  Point [A] (y-intercept): ( ___ , ___ )
  From [A] to [B], rise = ___ , run = ___
  Slope: ___
  Equation: y = ___x + ___
`,
    labels: { A: '(0, 0)', B: '(2, 4)', rise: '4', run: '2', slope: '2', equation: 'y = 2x' },
  },
  'balance-equation-model': {
    domain: 'ms-math-algebra',
    skill: 'one-step-equations',
    topic: 'Balance Model for Equations',
    description: 'A balance scale model showing an equation to solve.',
    diagram: `
          ┌───────┐
     [A]  │BALANCE│  [B]
          └───┬───┘
              ▲

  Left side [A]:  x + 3
  Right side [B]: 7

  To solve: subtract ___ from both sides.
  x = ___
`,
    labels: { A: 'x + 3', B: '7', subtract: '3', solution: '4' },
  },
  'number-line-inequality': {
    domain: 'ms-math-algebra',
    skill: 'graphing-inequalities',
    topic: 'Graphing an Inequality on a Number Line',
    description: 'A number line with an inequality solution to label.',
    diagram: `
  ←──+──+──+──[A]══════════→
    -1  0  1  2  3  4  5  6

  Circle type at [A]: ___ (open/closed)
  Shading direction: ___
  Inequality: x ___ 2
`,
    labels: { A: 'boundary point at 2', 'circle type': 'open', direction: 'right', inequality: 'x > 2' },
  },
  'function-machine': {
    domain: 'ms-math-algebra',
    skill: 'function-basics',
    topic: 'Function Machine Model',
    description: 'A function machine diagram showing inputs and outputs.',
    diagram: `
  Input (x)
      │
      ▼
  ┌────────┐
  │ [RULE] │
  │  ????  │
  └────┬───┘
       ▼
  Output (y)

  x: 1 → y: 5
  x: 2 → y: 8
  x: 3 → y: 11
  x: 4 → y: 14

  Rate of change: ___
  Starting value (when x=0): ___
  Rule: y = ___x + ___
`,
    labels: { 'rate of change': '3', 'starting value': '2', rule: 'y = 3x + 2' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CER PHENOMENA — Claim-Evidence-Reasoning writing prompts
// ═══════════════════════════════════════════════════════════════════════════════

const CER_PHENOMENA_LOCAL = {
  'phone-plan-comparison': {
    domain: 'ms-math-algebra',
    title: 'Which Phone Plan Is the Better Deal?',
    phenomenon: 'Plan A costs $20 per month plus $0.10 per text message. Plan B costs $40 per month with unlimited texting. A student who sends 150 texts per month chose Plan B, saying it was cheaper. Another student who sends 250 texts per month chose Plan A.',
    scaffold: {
      claim: 'Make a claim about which plan is better for each student.',
      evidence: 'Calculate the monthly cost for each student under each plan. Show your work.',
      reasoning: 'Use the concept of linear expressions and equations to explain why the better plan depends on the number of texts sent. At what point do the plans cost the same?',
    },
    keyTerms: ['expression', 'variable', 'equation', 'cost', 'rate', 'break-even'],
    rubric: {
      claim: { excellent: 'Correctly identifies which plan is cheaper for each student with specific costs', adequate: 'Identifies which plan is cheaper but without calculations', developing: 'Vague or incorrect claim' },
      evidence: { excellent: 'Calculates both plans for both students: Plan A at 150 texts = $35, Plan B = $40; Plan A at 250 texts = $45, Plan B = $40', adequate: 'Calculates for one student only', developing: 'No calculations or incorrect math' },
      reasoning: { excellent: 'Sets up 20 + 0.10t = 40 to find break-even at 200 texts and explains the linear relationship', adequate: 'Mentions that it depends on number of texts', developing: 'Incomplete connection between evidence and claim' },
    },
  },
  'linear-growth-patterns': {
    domain: 'ms-math-algebra',
    title: 'Predicting Plant Growth',
    phenomenon: 'Two plants are being tracked for a science experiment. Plant A starts at 3 cm tall and grows 2 cm per week. Plant B starts at 10 cm tall and grows 1 cm per week. After 5 weeks, a student predicts that Plant A will never be taller than Plant B.',
    scaffold: {
      claim: 'Make a claim about whether Plant A will ever be taller than Plant B.',
      evidence: 'Write equations for each plant\'s height over time. Calculate and compare heights at weeks 0, 3, 5, 7, and 10.',
      reasoning: 'Use the concept of linear functions and systems of equations to explain when and why Plant A overtakes Plant B.',
    },
    keyTerms: ['linear function', 'slope', 'y-intercept', 'system of equations', 'rate of change', 'intersection'],
    rubric: {
      claim: { excellent: 'States Plant A will be taller than Plant B after week 7 and the student prediction is wrong', adequate: 'States Plant A will eventually be taller', developing: 'Agrees with the incorrect prediction or vague' },
      evidence: { excellent: 'Writes A = 2t + 3 and B = t + 10, solves 2t + 3 = t + 10 to get t = 7, and shows height comparison table', adequate: 'Shows some calculations but incomplete table', developing: 'No equations or calculations' },
      reasoning: { excellent: 'Explains that Plant A has a greater rate of change (slope) so it will eventually overtake Plant B, and identifies the intersection at t = 7', adequate: 'Mentions growth rates differ', developing: 'Incomplete reasoning' },
    },
  },
  'inequality-constraints': {
    domain: 'ms-math-algebra',
    title: 'Planning a School Dance Budget',
    phenomenon: 'The student council has $500 to spend on a school dance. The DJ costs $200 and decorations cost $75. The rest of the budget goes to snacks, which cost $1.50 per student. They expect between 100 and 200 students to attend.',
    scaffold: {
      claim: 'Make a claim about the maximum number of students that can be served snacks within the budget.',
      evidence: 'Write an inequality representing the budget constraint. Solve it and check if the expected attendance is feasible.',
      reasoning: 'Explain how inequalities model real-world constraints and why this situation requires an inequality rather than an equation.',
    },
    keyTerms: ['inequality', 'constraint', 'budget', 'variable', 'solution set', 'maximum'],
    rubric: {
      claim: { excellent: 'States that up to 150 students can be served snacks within budget and the upper expected attendance of 200 exceeds the budget', adequate: 'States there is a limit to the number of students', developing: 'Vague or no specific claim' },
      evidence: { excellent: 'Sets up 200 + 75 + 1.50s <= 500, solves to get s <= 150, and checks against expected range', adequate: 'Sets up inequality but makes calculation error', developing: 'No inequality or no solution' },
      reasoning: { excellent: 'Explains that an inequality is needed because there is a maximum constraint, not an exact amount, and discusses the solution set', adequate: 'Mentions budget limit', developing: 'Incomplete connection' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIOS — real-world application scenarios for lessons
// ═══════════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { title: 'Starting a Lemonade Stand', focus: 'expressions, equations, profit', text: 'You spend $15 on supplies and sell lemonade for $2 per cup. Write an expression for your profit after selling c cups. How many cups do you need to sell to break even? How many to make $25 profit? Graph your profit as a function of cups sold.' },
  { title: 'Comparing Ride-Share Services', focus: 'linear functions, systems, slope', text: 'Service A charges $3 base fare plus $1.50 per mile. Service B charges $5 base fare plus $1.00 per mile. Write equations for each. When is Service A cheaper? When are they the same price? Graph both on the same coordinate plane and interpret the intersection.' },
  { title: 'Temperature Conversion', focus: 'linear functions, slope, intercept', text: 'The formula to convert Celsius to Fahrenheit is F = 9/5 C + 32. What is the slope and what does it mean? What is the y-intercept and what does it mean? At what temperature are Celsius and Fahrenheit equal? Graph the function.' },
  { title: 'Growing a Savings Account', focus: 'expressions, evaluating, patterns', text: 'You deposit $100 and add $25 each week. Write an expression for your total savings after w weeks. How long until you have $350? Your friend starts with $250 but only adds $10 per week. When will you have more savings than your friend?' },
  { title: 'Building a Fence', focus: 'equations, perimeter, word problems', text: 'A farmer has 120 feet of fencing to enclose a rectangular garden. She wants the length to be twice the width. Write and solve an equation to find the dimensions. What is the area of the garden? If she changes the length to three times the width, how does this affect the dimensions and area?' },
  { title: 'Concert Ticket Sales', focus: 'systems of equations, word problems', text: 'A concert sells floor seats for $50 and balcony seats for $30. If 400 total tickets are sold and the revenue is $16,000, how many of each type were sold? Set up and solve a system of equations. What happens to revenue if they increase floor seats by $10?' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY — algebra key terms
// ═══════════════════════════════════════════════════════════════════════════════

const VOCABULARY = {
  'variable': { definition: 'A letter or symbol that represents an unknown or changing value.', example: 'In 3x + 5, x is the variable.', chinese: '变量' },
  'constant': { definition: 'A number that does not change.', example: 'In 3x + 5, the number 5 is a constant.', chinese: '常量' },
  'coefficient': { definition: 'The number multiplied by a variable in a term.', example: 'In 7y, the coefficient is 7.', chinese: '系数' },
  'term': { definition: 'A single number, variable, or number-variable combination separated by + or -.', example: 'In 3x + 5y - 2, the terms are 3x, 5y, and -2.', chinese: '项' },
  'expression': { definition: 'A mathematical phrase with numbers, variables, and operations, but no equal sign.', example: '4x + 7 is an expression.', chinese: '表达式' },
  'equation': { definition: 'A mathematical statement that two expressions are equal, using an = sign.', example: '2x + 3 = 11 is an equation.', chinese: '方程' },
  'inequality': { definition: 'A mathematical statement comparing two expressions using <, >, ≤, or ≥.', example: 'x + 3 > 7 is an inequality.', chinese: '不等式' },
  'like terms': { definition: 'Terms with the same variable(s) raised to the same power.', example: '3x and 5x are like terms; 3x and 5x^2 are not.', chinese: '同类项' },
  'distributive property': { definition: 'a(b + c) = ab + ac. Multiply the outside by each term inside.', example: '3(x + 4) = 3x + 12.', chinese: '分配律' },
  'inverse operation': { definition: 'Operations that undo each other.', example: 'Addition and subtraction are inverse operations.', chinese: '逆运算' },
  'solution': { definition: 'A value that makes an equation or inequality true.', example: 'x = 4 is the solution to 2x + 3 = 11.', chinese: '解' },
  'function': { definition: 'A rule that assigns exactly one output to each input.', example: 'f(x) = 2x + 1 is a function.', chinese: '函数' },
  'domain': { definition: 'The set of all possible input values of a function.', example: 'For f(x) = x + 3, the domain can be all real numbers.', chinese: '定义域' },
  'range': { definition: 'The set of all possible output values of a function.', example: 'For f(x) = x^2, the range is y ≥ 0.', chinese: '值域' },
  'slope': { definition: 'The steepness of a line, measured as rise over run (change in y / change in x).', example: 'A line through (1, 2) and (3, 6) has slope (6-2)/(3-1) = 2.', chinese: '斜率' },
  'y-intercept': { definition: 'The point where a line crosses the y-axis (when x = 0).', example: 'In y = 3x + 5, the y-intercept is 5.', chinese: 'y轴截距' },
  'slope-intercept form': { definition: 'The form y = mx + b, where m is slope and b is y-intercept.', example: 'y = 2x - 3 has slope 2 and y-intercept -3.', chinese: '斜截式' },
  'system of equations': { definition: 'Two or more equations with the same variables solved together.', example: 'x + y = 10 and x - y = 4 form a system.', chinese: '方程组' },
  'exponent': { definition: 'A number that tells how many times to multiply the base by itself.', example: 'In x^3, the exponent is 3 (x × x × x).', chinese: '指数' },
  'polynomial': { definition: 'An expression with one or more terms with whole-number exponents.', example: '3x^2 + 2x - 5 is a polynomial.', chinese: '多项式' },
  'quadratic': { definition: 'A polynomial of degree 2, in the form ax^2 + bx + c.', example: 'x^2 - 4x + 3 is a quadratic expression.', chinese: '二次的' },
  'parabola': { definition: 'The U-shaped curve that is the graph of a quadratic function.', example: 'The graph of y = x^2 is a parabola opening upward.', chinese: '抛物线' },
  'substitution': { definition: 'Replacing a variable with a number or another expression.', example: 'If y = x + 2, substitute into x + y = 10 to get x + (x+2) = 10.', chinese: '代入法' },
  'elimination': { definition: 'Adding or subtracting equations to remove a variable.', example: 'Add x + y = 10 and x - y = 4 to get 2x = 14.', chinese: '消元法' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Exercise generation helper
// ═══════════════════════════════════════════════════════════════════════════════

function generateExercise(skill, count = 5, mastery = null, seenQ = null) {
  return _generateExercise({ bank: QUESTION_BANKS[skill], skill, count, mastery, seenQ, type: 'exercise', instruction: 'Answer each question.' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS — extends DomainSkillBase
// ═══════════════════════════════════════════════════════════════════════════════

class MSMathAlgebra extends DomainSkillBase {
  constructor() {
    super('ms-math-algebra', 'ms-math-algebra', DATA_DIR, loadProfile, saveProfile, HINT_BANKS);
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
        if (m < MASTERY_THRESHOLD && _algebraTopicUnlocked(sk, p.skills)) {
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
        const isUnlocked = _algebraTopicUnlocked(sk, p.skills);
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
    if (!target) return { message: 'All algebra skills are proficient!', congratulations: true };
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
        apply: scenario ? `Analyze scenario: "${scenario.title}"` : 'Connect to real-world algebra applications',
        extend: `Connect ${target.skill} to related algebra concepts`,
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
    if (!name) return { labs: Object.keys(VIRTUAL_LABS), instructions: 'node algebra.js lab <id> <lab-name> [obs-key]' };
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

  getVocabulary(topic) {
    if (!topic) return { terms: Object.keys(VOCABULARY), count: Object.keys(VOCABULARY).length };
    const v = VOCABULARY[topic];
    if (!v) return { error: `Unknown term: ${topic}. Available: ${Object.keys(VOCABULARY).join(', ')}` };
    return { term: topic, ...v };
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
      message: due.length === 0 ? 'No algebra skills due for review today!' : `${due.length} skill(s) need review. Work through each exercise below.`,
    };
  }
}

module.exports = MSMathAlgebra;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI: node algebra.js <command> [args]
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const api = new MSMathAlgebra();
  const common = buildCommonCLIHandlers(api, DATA_DIR, 'ms-math-algebra', loadProfile, saveProfile);
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
      case 'vocab': {
        const [, id, term] = args;
        if (!id) throw new Error('Usage: vocab <id> [term]');
        out(api.getVocabulary(term || null));
        break;
      }
      case 'help': out({
        skill: 'ms-math-algebra',
        gradeLevel: '6-8',
        standards: 'CCSS Math — Algebraic Thinking',
        usage: 'node algebra.js <command> [args]',
        commands: {
          'start <id>': 'Start a student session; includes last session state for resume prompt',
          'resume <id>': 'Resume last session or offer to start fresh if >24h old',
          'lesson <id>': 'Generate a lesson with concept explanation and exercises',
          'exercise <id> [skill]': 'Generate 5 practice items; optionally filter by skill',
          'check <id> <type> <expected> <answer> [skill]': 'Check an answer; returns misconception feedback if wrong',
          'record <id> <skill> <score> <total> [hints] [notes]': 'Save a scored assessment attempt',
          'progress <id>': 'Show mastery levels across all algebra skills',
          'report <id>': 'Full performance report with SR data',
          'next <id> [count]': 'List next skills to study (by lowest mastery)',
          'catalog': 'List all skill categories and topics',
          'students': 'List all student IDs with saved profiles',
          'review <id>': 'List skills due for spaced repetition today',
          'hint <id> <skill>': 'Get next hint tier (3 tiers; reduces mastery credit)',
          'hint-reset <id> [skill]': 'Reset hint counter for a skill',
          'lab <id> [lab-name] [obs-key]': 'Start or explore a virtual lab; omit name to list available labs',
          'diagram <id> [topic]': 'Show diagram with blank labels to fill in',
          'diagram-check <id> <topic> <answers-json>': 'Check label answers for a diagram',
          'cer <id> [topic]': 'Present a CER phenomenon with scaffold prompts',
          'cer-check <id> <topic> <claim> <evidence> <reasoning>': 'Evaluate CER response against rubric',
          'cer-history <id>': 'Show past CER attempts, scores, and trend',
          'vocab <id> [topic]': 'Pre-teach algebra vocabulary',
          'phenomenon [category]': 'Get a driving-question phenomenon for phenomenon-based learning',
          'scenario': 'Get a real-world application scenario',
          'profile <id> set-language-support <level>': 'Set ELL support',
          'profile <id> set-reading-level <grade>': 'Set reading level grade (6-8)',
          'profile <id> set-accommodations <list>': 'Set accommodations',
          'profile <id> show': 'Show current differentiation settings',
          'standards <id>': 'Show CCSS standards practiced and mastery per standard',
          'socratic <id> [topic]': 'Start a Socratic dialogue session',
          'socratic-record <id> <topic> <score> [notes]': 'Record completed Socratic session (score 0-100)',
          'suggest-next <id>': 'Cross-skill recommendations',
          'progression <id>': 'Show mastery-gated progression map',
        },
      }); break;
      default: out({
        usage: 'node algebra.js <command> [args]',
        commands: ['start', 'resume', 'lesson', 'exercise', 'check', 'record', 'progress', 'report', 'next', 'catalog', 'students', 'review', 'hint', 'hint-reset', 'lab', 'diagram', 'diagram-check', 'cer', 'cer-check', 'cer-history', 'vocab', 'phenomenon', 'scenario', 'profile', 'standards', 'socratic', 'socratic-record', 'suggest-next', 'progression', 'help'],
      });
    }
  });
}
