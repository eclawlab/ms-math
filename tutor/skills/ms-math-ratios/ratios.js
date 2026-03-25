// eClaw MS Math Ratios, Proportions & Percents Tutor (6-8).
// CCSS 6.RP, 7.RP aligned.

const { dataDir, loadProfile: _lp, saveProfile: _sp, listProfiles, calcMastery, masteryLabel, shuffle, pick, runCLI, srGrade, srUpdate, srEffectiveMastery, srDueToday, MASTERY_THRESHOLD, saveSessionState, loadSessionState, fsrsUpdateStability, fsrsUpdateDifficulty, fsrsNextReview, today } = require('../_lib/core');
const { buildDiffContext } = require('../_lib/differentiation');
const { DomainSkillBase, buildCommonCLIHandlers, generateExercise: _generateExercise, checkAnswer: _checkAnswer } = require('../_lib/exercise-factory');

const DATA_DIR = dataDir('ms-math-ratios');
const loadProfile = id => _lp(DATA_DIR, id);
const saveProfile = p => _sp(DATA_DIR, p);

const SKILLS = {
  'ratio-basics': ['understanding-ratios', 'equivalent-ratios', 'ratio-tables', 'unit-rates'],
  'proportions': ['writing-proportions', 'solving-proportions', 'scale-drawings', 'similar-figures'],
  'percents': ['percent-basics', 'percent-of-a-number', 'percent-change', 'discount-tax-tip', 'simple-interest'],
  'applications': ['constant-of-proportionality', 'proportional-relationships', 'direct-variation', 'percent-word-problems'],
};

// Prerequisites: topic → [topics that must be mastered first].
const TOPIC_PREREQUISITES = {
  // ratio-basics (foundational)
  'understanding-ratios': [],
  'equivalent-ratios': ['understanding-ratios'],
  'ratio-tables': ['equivalent-ratios'],
  'unit-rates': ['equivalent-ratios'],
  // proportions
  'writing-proportions': ['equivalent-ratios'],
  'solving-proportions': ['writing-proportions'],
  'scale-drawings': ['solving-proportions'],
  'similar-figures': ['solving-proportions'],
  // percents
  'percent-basics': ['equivalent-ratios'],
  'percent-of-a-number': ['percent-basics', 'solving-proportions'],
  'percent-change': ['percent-of-a-number'],
  'discount-tax-tip': ['percent-of-a-number'],
  'simple-interest': ['percent-of-a-number'],
  // applications
  'constant-of-proportionality': ['unit-rates', 'solving-proportions'],
  'proportional-relationships': ['constant-of-proportionality'],
  'direct-variation': ['proportional-relationships'],
  'percent-word-problems': ['percent-change', 'discount-tax-tip', 'simple-interest'],
};

// Helper: is a topic unlocked (all prereqs mastered)?
function _ratiosTopicUnlocked(topic, profileSkills) {
  return (TOPIC_PREREQUISITES[topic] || []).every(r => (profileSkills[r]?.mastery || 0) >= MASTERY_THRESHOLD);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANKS — 8 questions per skill, CCSS 6.RP & 7.RP aligned
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION_BANKS = {
  // ── ratio-basics ────────────────────────────────────────────────────────────
  'understanding-ratios': { questions: [
    { q: 'A class has 12 boys and 18 girls. What is the ratio of boys to girls in simplest form?', a: '2:3', type: 'short', difficulty: 1 },
    { q: 'What is a ratio?', a: 'a comparison of two quantities', type: 'short', difficulty: 1 },
    { q: 'Write the ratio 15 to 25 in simplest form.', a: '3:5', type: 'short', difficulty: 1 },
    { q: 'True or false: The ratio 4:6 is the same as the ratio 6:4.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A bag has 5 red marbles and 8 blue marbles. What is the ratio of red marbles to total marbles?', a: '5:13', type: 'short', difficulty: 2 },
    { q: 'In a parking lot there are 24 cars and 6 trucks. What is the ratio of trucks to cars in simplest form?', a: '1:4', type: 'short', difficulty: 2 },
    { q: 'Name three ways to write the ratio 3 to 7.', a: ['3 to 7, 3:7, 3/7', '3:7, 3 to 7, 3/7'], type: 'multi', difficulty: 1 },
    { q: 'A recipe calls for 2 cups of flour for every 3 cups of sugar. If you use 10 cups of flour, how many cups of sugar do you need?', a: '15', type: 'short', difficulty: 3 },
  ]},
  'equivalent-ratios': { questions: [
    { q: 'Are the ratios 2:3 and 6:9 equivalent? Explain.', a: 'yes because 6:9 simplifies to 2:3', type: 'open', difficulty: 1 },
    { q: 'Find a ratio equivalent to 4:5 with a first term of 12.', a: '12:15', type: 'short', difficulty: 1 },
    { q: 'Find a ratio equivalent to 3:8 with a second term of 40.', a: '15:40', type: 'short', difficulty: 2 },
    { q: 'True or false: 5:10 and 1:2 are equivalent ratios.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Which ratio is NOT equivalent to 6:9? A) 2:3 B) 12:18 C) 4:7 D) 18:27', a: 'C', type: 'short', difficulty: 2 },
    { q: 'The ratio of cats to dogs at a shelter is 3:5. If there are 21 cats, how many dogs are there?', a: '35', type: 'short', difficulty: 2 },
    { q: 'How do you determine whether two ratios are equivalent?', a: 'cross multiply and check if the products are equal or simplify both to lowest terms', type: 'open', difficulty: 2 },
    { q: 'Find the missing value: 7:? = 21:36', a: '12', type: 'short', difficulty: 3 },
  ]},
  'ratio-tables': { questions: [
    { q: 'Complete the ratio table for 2:5 → (4:?, 6:?, 8:?).', a: ['10, 15, 20', '4:10, 6:15, 8:20'], type: 'multi', difficulty: 1 },
    { q: 'What is a ratio table?', a: 'a table that shows pairs of numbers that have the same ratio', type: 'short', difficulty: 1 },
    { q: 'A ratio table shows 3:7, 6:14, 9:21. What is the next pair?', a: '12:28', type: 'short', difficulty: 1 },
    { q: 'True or false: In a ratio table, you can only multiply both values by the same number.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'Using the ratio 4:9, fill in the blank: 20:?', a: '45', type: 'short', difficulty: 2 },
    { q: 'A lemonade recipe uses a 1:4 ratio of lemon juice to water. Complete the table: 2:?, ?:20, 5:?', a: ['8, 5, 20', '2:8, 5:20, 5:20'], type: 'multi', difficulty: 2 },
    { q: 'A ratio table shows 5:8, 15:24, 25:40. What ratio did they skip?', a: '10:16', type: 'short', difficulty: 2 },
    { q: 'Write a ratio table with 4 entries for the ratio 6:11.', a: ['6:11, 12:22, 18:33, 24:44', '6:11 12:22 18:33 24:44'], type: 'multi', difficulty: 3 },
  ]},
  'unit-rates': { questions: [
    { q: 'If 3 pounds of apples cost $5.40, what is the cost per pound?', a: '$1.80', type: 'short', difficulty: 1 },
    { q: 'What is a unit rate?', a: 'a rate with a denominator of 1', type: 'short', difficulty: 1 },
    { q: 'A car travels 240 miles on 8 gallons of gas. What is the unit rate in miles per gallon?', a: '30 miles per gallon', type: 'short', difficulty: 1 },
    { q: 'True or false: 60 miles per hour is a unit rate.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Store A sells 5 notebooks for $8.75. Store B sells 3 notebooks for $4.95. Which store has the better price per notebook?', a: ['Store B', 'B'], type: 'multi', difficulty: 2 },
    { q: 'A factory produces 450 widgets in 6 hours. What is the production rate per hour?', a: '75 widgets per hour', type: 'short', difficulty: 2 },
    { q: 'Maria types 210 words in 3 minutes. Juan types 350 words in 5 minutes. Who types faster?', a: ['Maria', 'Maria types faster at 70 words per minute vs 70 words per minute so they are the same'], type: 'multi', difficulty: 2 },
    { q: 'A runner completes 5 laps in 12 minutes. What is the unit rate in minutes per lap?', a: '2.4 minutes per lap', type: 'short', difficulty: 2 },
  ]},

  // ── proportions ─────────────────────────────────────────────────────────────
  'writing-proportions': { questions: [
    { q: 'Write a proportion for: 3 is to 5 as 9 is to 15.', a: ['3/5 = 9/15', '3:5 = 9:15'], type: 'multi', difficulty: 1 },
    { q: 'What is a proportion?', a: 'an equation that states two ratios are equal', type: 'short', difficulty: 1 },
    { q: 'True or false: 4/6 = 10/15 is a proportion.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Set up a proportion: If 2 pencils cost $0.50, how much do 8 pencils cost?', a: ['2/0.50 = 8/x', '0.50/2 = x/8', '2:0.50 = 8:x'], type: 'multi', difficulty: 2 },
    { q: 'Is 3/7 = 9/21 a true proportion? How do you know?', a: 'yes because 3 times 21 equals 63 and 7 times 9 equals 63', type: 'open', difficulty: 2 },
    { q: 'Write a proportion to represent: A map scale is 1 inch = 50 miles. Two cities are 3.5 inches apart.', a: ['1/50 = 3.5/x', '1:50 = 3.5:x'], type: 'multi', difficulty: 2 },
    { q: 'True or false: 5/8 = 15/25 is a true proportion.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A car uses 2 gallons of gas to travel 56 miles. Write and solve a proportion to find how many gallons it needs for 196 miles.', a: ['7 gallons', '7'], type: 'multi', difficulty: 3 },
  ]},
  'solving-proportions': { questions: [
    { q: 'Solve: x/4 = 15/20', a: '3', type: 'short', difficulty: 1 },
    { q: 'Solve: 6/9 = 10/x', a: '15', type: 'short', difficulty: 1 },
    { q: 'Solve: 3/x = 12/28', a: '7', type: 'short', difficulty: 1 },
    { q: 'What is cross-multiplication?', a: 'multiplying the numerator of each fraction by the denominator of the other to solve a proportion', type: 'short', difficulty: 1 },
    { q: 'Solve: 8/12 = x/27', a: '18', type: 'short', difficulty: 2 },
    { q: 'Solve: 5/7 = 35/x', a: '49', type: 'short', difficulty: 2 },
    { q: 'True or false: To solve a proportion, you can multiply both sides by the same number.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Solve: 2.5/x = 10/16', a: '4', type: 'short', difficulty: 3 },
  ]},
  'scale-drawings': { questions: [
    { q: 'A map has a scale of 1 cm = 50 km. Two cities are 3 cm apart on the map. What is the actual distance?', a: '150 km', type: 'short', difficulty: 1 },
    { q: 'What is a scale drawing?', a: 'a drawing that uses a ratio to represent an object that is too large or too small to draw at actual size', type: 'short', difficulty: 1 },
    { q: 'A blueprint has a scale of 1 inch = 4 feet. A room measures 5 inches long on the blueprint. What is the actual length?', a: '20 feet', type: 'short', difficulty: 1 },
    { q: 'True or false: A scale of 1:100 means 1 cm on the drawing equals 100 cm in real life.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A model car is built at a 1:24 scale. If the real car is 4.8 meters long, how long is the model?', a: ['0.2 m', '20 cm'], type: 'multi', difficulty: 2 },
    { q: 'On a map with scale 1 inch = 25 miles, the actual distance between two towns is 75 miles. How far apart are they on the map?', a: '3 inches', type: 'short', difficulty: 2 },
    { q: 'A floor plan uses a scale of 1 cm = 2.5 m. A hallway is 3.2 cm on the plan. What is the actual length?', a: '8 m', type: 'short', difficulty: 2 },
    { q: 'An architect draws a building at 1:200 scale. The drawing is 15 cm tall. How tall is the actual building in meters?', a: '30 m', type: 'short', difficulty: 3 },
  ]},
  'similar-figures': { questions: [
    { q: 'What are similar figures?', a: 'figures that have the same shape but not necessarily the same size with proportional sides and equal angles', type: 'short', difficulty: 1 },
    { q: 'Two rectangles are similar. Rectangle A is 4 cm by 6 cm. Rectangle B has a width of 10 cm. What is its length?', a: '15 cm', type: 'short', difficulty: 1 },
    { q: 'True or false: All squares are similar to each other.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Triangle ABC has sides 3, 4, 5. Triangle DEF is similar with shortest side 9. What are the other two sides?', a: ['12 and 15', '12, 15'], type: 'multi', difficulty: 2 },
    { q: 'True or false: All rectangles are similar to each other.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A flagpole casts a 12 ft shadow. At the same time, a 5 ft person casts a 3 ft shadow. How tall is the flagpole?', a: '20 ft', type: 'short', difficulty: 2 },
    { q: 'Two similar triangles have a scale factor of 2:5. If the perimeter of the smaller triangle is 18 cm, what is the perimeter of the larger?', a: '45 cm', type: 'short', difficulty: 3 },
    { q: 'How do you prove two triangles are similar?', a: 'show that all corresponding angles are equal or that all corresponding sides are proportional', type: 'open', difficulty: 2 },
  ]},

  // ── percents ────────────────────────────────────────────────────────────────
  'percent-basics': { questions: [
    { q: 'What does percent mean?', a: ['per hundred', 'out of 100'], type: 'multi', difficulty: 1 },
    { q: 'Convert 3/4 to a percent.', a: '75%', type: 'short', difficulty: 1 },
    { q: 'Convert 40% to a fraction in simplest form.', a: '2/5', type: 'short', difficulty: 1 },
    { q: 'Convert 0.65 to a percent.', a: '65%', type: 'short', difficulty: 1 },
    { q: 'True or false: 150% is possible.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Convert 7/8 to a percent.', a: '87.5%', type: 'short', difficulty: 2 },
    { q: 'Order from least to greatest: 0.45, 3/8, 42%.', a: ['3/8, 42%, 0.45', '3/8 42% 0.45', '37.5%, 42%, 45%'], type: 'multi', difficulty: 2 },
    { q: 'Convert 0.4% to a decimal.', a: '0.004', type: 'short', difficulty: 3 },
  ]},
  'percent-of-a-number': { questions: [
    { q: 'What is 25% of 80?', a: '20', type: 'short', difficulty: 1 },
    { q: 'What is 10% of 250?', a: '25', type: 'short', difficulty: 1 },
    { q: 'What is 50% of 136?', a: '68', type: 'short', difficulty: 1 },
    { q: 'True or false: To find 1% of a number, you divide by 100.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is 15% of 200?', a: '30', type: 'short', difficulty: 2 },
    { q: 'What is 120% of 50?', a: '60', type: 'short', difficulty: 2 },
    { q: '30 is what percent of 120?', a: '25%', type: 'short', difficulty: 2 },
    { q: '18 is 40% of what number?', a: '45', type: 'short', difficulty: 3 },
  ]},
  'percent-change': { questions: [
    { q: 'A shirt was $40 and is now $30. What is the percent decrease?', a: '25%', type: 'short', difficulty: 1 },
    { q: 'What is the formula for percent change?', a: 'percent change = (new value minus original value) divided by original value times 100', type: 'short', difficulty: 1 },
    { q: 'A population grew from 500 to 600. What is the percent increase?', a: '20%', type: 'short', difficulty: 1 },
    { q: 'True or false: Percent change is always calculated using the original value as the base.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A stock price went from $80 to $100. What is the percent increase?', a: '25%', type: 'short', difficulty: 2 },
    { q: 'A laptop price dropped from $1200 to $900. What is the percent decrease?', a: '25%', type: 'short', difficulty: 2 },
    { q: 'A plant was 8 cm tall and grew to 14 cm. What is the percent increase?', a: '75%', type: 'short', difficulty: 2 },
    { q: 'A price increased by 20% and then decreased by 20%. Is the final price the same as the original? Explain.', a: 'no because the 20% decrease is calculated on the higher price so the final price is lower than the original', type: 'open', difficulty: 3 },
  ]},
  'discount-tax-tip': { questions: [
    { q: 'A jacket costs $60 and is 25% off. What is the sale price?', a: '$45', type: 'short', difficulty: 1 },
    { q: 'A meal costs $24. You leave a 15% tip. How much is the tip?', a: '$3.60', type: 'short', difficulty: 1 },
    { q: 'An item costs $50 and the sales tax is 8%. What is the total cost?', a: '$54', type: 'short', difficulty: 1 },
    { q: 'True or false: A 30% discount on a $100 item saves you $30.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A pair of shoes costs $85 and is on sale for 40% off. What is the sale price?', a: '$51', type: 'short', difficulty: 2 },
    { q: 'A restaurant bill is $56. You want to leave a 20% tip. What is the total amount you pay?', a: '$67.20', type: 'short', difficulty: 2 },
    { q: 'An item originally costs $120. It is discounted 15%, then you pay 6% tax on the sale price. What is the final cost?', a: '$108.12', type: 'short', difficulty: 3 },
    { q: 'Which saves you more money: a 20% discount followed by a 10% discount, or a single 30% discount? Explain.', a: 'the single 30% discount saves more because successive discounts result in a 28% total discount', type: 'open', difficulty: 3 },
  ]},
  'simple-interest': { questions: [
    { q: 'You deposit $500 at 4% annual interest. How much interest do you earn in 3 years?', a: '$60', type: 'short', difficulty: 1 },
    { q: 'What is the formula for simple interest?', a: ['I = Prt', 'interest = principal times rate times time'], type: 'multi', difficulty: 1 },
    { q: 'You borrow $1000 at 5% annual simple interest for 2 years. How much interest do you owe?', a: '$100', type: 'short', difficulty: 1 },
    { q: 'True or false: Simple interest is calculated only on the original principal.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'An investment of $800 earns 3% simple interest per year. What is the total value after 4 years?', a: '$896', type: 'short', difficulty: 2 },
    { q: 'You borrow $2000 at 6% simple interest. After how many years will you owe $360 in interest?', a: '3 years', type: 'short', difficulty: 2 },
    { q: 'A savings account pays 2.5% simple interest per year. You deposit $1200. How much interest do you earn in 6 months?', a: '$15', type: 'short', difficulty: 2 },
    { q: 'You want to earn $200 in interest in 2 years at 5% simple interest. How much do you need to deposit?', a: '$2000', type: 'short', difficulty: 3 },
  ]},

  // ── applications ────────────────────────────────────────────────────────────
  'constant-of-proportionality': { questions: [
    { q: 'What is the constant of proportionality?', a: 'the constant ratio between two proportional quantities often written as k in y = kx', type: 'short', difficulty: 1 },
    { q: 'In the equation y = 3x, what is the constant of proportionality?', a: '3', type: 'short', difficulty: 1 },
    { q: 'A table shows (2, 6), (4, 12), (5, 15). What is the constant of proportionality?', a: '3', type: 'short', difficulty: 1 },
    { q: 'True or false: If y/x is always the same value, the relationship is proportional.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Bananas cost $0.60 per pound. Write an equation where c is cost and p is pounds.', a: ['c = 0.60p', 'c = 0.6p'], type: 'multi', difficulty: 2 },
    { q: 'A graph of a proportional relationship passes through (0, 0) and (4, 10). What is k?', a: '2.5', type: 'short', difficulty: 2 },
    { q: 'Does the table (1, 3), (2, 6), (3, 10) represent a proportional relationship? Explain.', a: 'no because 3/1 = 3, 6/2 = 3, but 10/3 is not 3', type: 'open', difficulty: 2 },
    { q: 'A car travels at a constant speed. After 2 hours it has gone 110 miles and after 5 hours it has gone 275 miles. What is the constant of proportionality and what does it represent?', a: '55 and it represents the speed in miles per hour', type: 'short', difficulty: 3 },
  ]},
  'proportional-relationships': { questions: [
    { q: 'How can you tell if a relationship is proportional from a graph?', a: 'it is a straight line that passes through the origin', type: 'short', difficulty: 1 },
    { q: 'How can you tell if a table shows a proportional relationship?', a: 'the ratio y/x is the same for all pairs', type: 'short', difficulty: 1 },
    { q: 'True or false: The equation y = 2x + 1 represents a proportional relationship.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'True or false: The equation y = 4x represents a proportional relationship.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A table shows (1, 5), (2, 10), (3, 15), (4, 20). Is this proportional? If so, write the equation.', a: ['yes, y = 5x', 'y = 5x'], type: 'multi', difficulty: 2 },
    { q: 'Give an example of a proportional relationship from everyday life.', a: ['the total cost of items at a fixed price per item', 'distance traveled at constant speed', 'the total weight of identical objects'], type: 'multi', difficulty: 2 },
    { q: 'A graph shows a straight line through (0, 0) and (6, 9). Write the equation.', a: ['y = 1.5x', 'y = 3/2 x', 'y = 3x/2'], type: 'multi', difficulty: 2 },
    { q: 'Explain why y = 3x is proportional but y = 3x + 2 is not.', a: 'y = 3x passes through the origin so y/x is always 3 but y = 3x + 2 does not pass through the origin so y/x changes', type: 'open', difficulty: 3 },
  ]},
  'direct-variation': { questions: [
    { q: 'What is direct variation?', a: 'a relationship where y = kx and k is a nonzero constant', type: 'short', difficulty: 1 },
    { q: 'If y varies directly with x and y = 12 when x = 4, what is k?', a: '3', type: 'short', difficulty: 1 },
    { q: 'True or false: In direct variation, when x doubles, y also doubles.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'If y varies directly with x and y = 15 when x = 3, find y when x = 7.', a: '35', type: 'short', difficulty: 2 },
    { q: 'The distance d a spring stretches varies directly with the weight w attached. If d = 6 cm when w = 4 N, find d when w = 10 N.', a: '15 cm', type: 'short', difficulty: 2 },
    { q: 'Which equation represents direct variation? A) y = 3x B) y = 3x + 1 C) y = x^2 D) y = 3/x', a: 'A', type: 'short', difficulty: 2 },
    { q: 'If y varies directly with x and the graph passes through (5, 20), write the equation.', a: 'y = 4x', type: 'short', difficulty: 2 },
    { q: 'The amount of gas used by a car varies directly with distance driven. If the car uses 3 gallons for 84 miles, how many gallons does it use for 210 miles?', a: '7.5 gallons', type: 'short', difficulty: 3 },
  ]},
  'percent-word-problems': { questions: [
    { q: 'A store marks up the wholesale price of a shirt by 60%. If the wholesale price is $25, what is the retail price?', a: '$40', type: 'short', difficulty: 1 },
    { q: 'A town had 8000 people last year and 8400 this year. What is the percent increase?', a: '5%', type: 'short', difficulty: 1 },
    { q: 'A student scored 45 out of 60 on a test. What is the percent score?', a: '75%', type: 'short', difficulty: 1 },
    { q: 'True or false: If a price increases by 50% and then decreases by 50%, it returns to the original price.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A phone originally costs $600. It is discounted 20%, then an additional 10% off the sale price. What is the final price?', a: '$432', type: 'short', difficulty: 2 },
    { q: 'A salesperson earns a 6% commission. How much does she earn on $15,000 in sales?', a: '$900', type: 'short', difficulty: 2 },
    { q: 'After a 15% raise, an employee earns $46,000. What was the original salary?', a: '$40,000', type: 'short', difficulty: 3 },
    { q: 'A car depreciates 12% per year. If it is worth $20,000 now, what will it be worth after 1 year? After 2 years?', a: ['$17,600 after 1 year and $15,488 after 2 years', '17600 and 15488'], type: 'multi', difficulty: 3 },
  ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// HINT BANKS — 3-tier scaffolded hints per skill
// ═══════════════════════════════════════════════════════════════════════════════

const HINT_BANKS = {
  // ratio-basics
  'understanding-ratios': { tier1: 'A ratio compares two quantities. Think about how many of one thing compared to another.', tier2: 'Write the ratio as a fraction and simplify by dividing both numbers by their GCF.', tier3: 'Example: 12 boys and 18 girls → 12:18 → divide both by 6 → 2:3.' },
  'equivalent-ratios': { tier1: 'Equivalent ratios are like equivalent fractions — multiply or divide both parts by the same number.', tier2: 'To check if two ratios are equivalent, cross-multiply or simplify both to lowest terms.', tier3: 'Example: 2:3 and 6:9 → 6÷3=2, 9÷3=3 → both simplify to 2:3 → equivalent.' },
  'ratio-tables': { tier1: 'A ratio table lists pairs of numbers that all share the same ratio.', tier2: 'To extend a ratio table, multiply both values by the same whole number. You can also add corresponding entries.', tier3: 'Example: Ratio 3:5 → Table: 3:5, 6:10, 9:15, 12:20 (multiply by 1, 2, 3, 4).' },
  'unit-rates': { tier1: 'A unit rate tells you the amount per ONE unit. Divide to find it.', tier2: 'Divide the first quantity by the second to get "per one." Make sure you keep track of which unit goes on top.', tier3: 'Example: $5.40 for 3 lb → $5.40 ÷ 3 = $1.80 per pound.' },

  // proportions
  'writing-proportions': { tier1: 'A proportion is two equal ratios. Set up matching units on each side.', tier2: 'Make sure the same units are in the same position: top/top must match and bottom/bottom must match.', tier3: 'Example: 2 pencils/$0.50 = 8 pencils/$x → units match (pencils on top, dollars on bottom).' },
  'solving-proportions': { tier1: 'Cross-multiply to solve. Multiply the diagonals and set them equal.', tier2: 'For a/b = c/d → ad = bc. Then solve for the unknown by dividing.', tier3: 'Example: x/4 = 15/20 → 20x = 60 → x = 3.' },
  'scale-drawings': { tier1: 'Use the scale as a ratio and set up a proportion to find the actual measurement.', tier2: 'Scale tells you "drawing measurement : actual measurement." Multiply the drawing measurement by the scale factor.', tier3: 'Example: Scale 1 cm = 50 km, drawing distance = 3 cm → actual = 3 × 50 = 150 km.' },
  'similar-figures': { tier1: 'Similar figures have proportional sides. Set up a proportion with corresponding sides.', tier2: 'Find the scale factor by dividing corresponding sides, then use it to find unknown sides.', tier3: 'Example: Triangle sides 3, 4, 5 similar to ?, ?, 15 → scale factor = 15/5 = 3 → sides are 9, 12, 15.' },

  // percents
  'percent-basics': { tier1: 'Percent means "per hundred." To convert a fraction, divide and multiply by 100.', tier2: 'Fraction → decimal: divide numerator by denominator. Decimal → percent: multiply by 100.', tier3: 'Example: 3/4 = 0.75 = 75%. Reverse: 40% = 40/100 = 2/5.' },
  'percent-of-a-number': { tier1: 'To find a percent of a number, convert the percent to a decimal and multiply.', tier2: 'Method: percent × number. Convert percent to decimal first (divide by 100).', tier3: 'Example: 25% of 80 → 0.25 × 80 = 20.' },
  'percent-change': { tier1: 'Find the difference, then divide by the original value and multiply by 100.', tier2: 'Formula: |new − original| / original × 100%. Use the ORIGINAL value as the denominator.', tier3: 'Example: Price went from $40 to $30 → change = 10 → 10/40 × 100 = 25% decrease.' },
  'discount-tax-tip': { tier1: 'Discount: subtract the percent from the price. Tax/tip: add the percent to the price.', tier2: 'Find the dollar amount of the discount/tax/tip first, then add or subtract from the original price.', tier3: 'Example: $60 jacket, 25% off → discount = 0.25 × 60 = $15 → sale price = $60 − $15 = $45.' },
  'simple-interest': { tier1: 'Use I = Prt. P = principal (amount), r = rate (as a decimal), t = time in years.', tier2: 'Convert the percent rate to a decimal before multiplying. Make sure time is in years.', tier3: 'Example: $500 at 4% for 3 years → I = 500 × 0.04 × 3 = $60.' },

  // applications
  'constant-of-proportionality': { tier1: 'The constant of proportionality k is the ratio y/x that stays the same.', tier2: 'Find k by dividing y by x for any pair. If y/x is the same for all pairs, the relationship is proportional with that k.', tier3: 'Example: (2, 6), (4, 12), (5, 15) → 6/2 = 3, 12/4 = 3, 15/5 = 3 → k = 3, equation: y = 3x.' },
  'proportional-relationships': { tier1: 'Proportional relationships have a constant ratio and their graphs pass through the origin.', tier2: 'Check: does y/x give the same value every time? Does the graph go through (0, 0)?', tier3: 'Example: y = 5x is proportional (line through origin). y = 5x + 2 is NOT (y-intercept is 2, not 0).' },
  'direct-variation': { tier1: 'Direct variation means y = kx. When one variable increases, the other increases proportionally.', tier2: 'Find k using a known pair: k = y/x. Then use y = kx to find any other value.', tier3: 'Example: y = 12 when x = 4 → k = 12/4 = 3 → y = 3x → when x = 7, y = 21.' },
  'percent-word-problems': { tier1: 'Read carefully: is the problem asking for percent increase, decrease, markup, discount, or commission?', tier2: 'Identify the original value (the base). All percent calculations are done relative to the base.', tier3: 'Example: Wholesale $25, markup 60% → markup = 0.60 × 25 = $15 → retail = $25 + $15 = $40.' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MISCONCEPTIONS — pattern-matched corrections per skill
// ═══════════════════════════════════════════════════════════════════════════════

const MISCONCEPTIONS = {
  'understanding-ratios': [
    { patterns: [/ratio.*same.*fraction|fraction.*same.*ratio/i], correction: 'A ratio and a fraction are related but not identical. A ratio compares two quantities (e.g., boys to girls = 2:3), while a fraction represents a part of a whole (e.g., 2/5 of students are boys). The ratio 2:3 is not the same as the fraction 2/3.' },
  ],
  'equivalent-ratios': [
    { patterns: [/add.*same.*number|add.*both.*sides/i], correction: 'You cannot find equivalent ratios by adding the same number to both parts. You must MULTIPLY (or divide) both parts by the same number. Example: 2:3 → multiply both by 4 → 8:12 (equivalent). But 2:3 → add 4 → 6:7 (NOT equivalent).' },
  ],
  'unit-rates': [
    { patterns: [/bigger.*always.*better|more.*always.*better/i], correction: 'A bigger unit rate is not always better — it depends on the context. For price per item, a LOWER rate is better (cheaper). For miles per gallon, a HIGHER rate is better (more efficient). Always think about what the rate means.' },
  ],
  'solving-proportions': [
    { patterns: [/add.*cross|cross.*add/i], correction: 'Cross-multiplication means you MULTIPLY, not add. For a/b = c/d, you multiply a × d and b × c, then set them equal: ad = bc. Do not add the diagonals.' },
  ],
  'percent-basics': [
    { patterns: [/percent.*bigger.*1|percent.*can.*not.*over.*100|no.*more.*100/i], correction: 'Percents CAN be greater than 100%. For example, 150% of 20 = 30. This means 1.5 times the original amount. Any time the new value is greater than the base, the percent is over 100%.' },
  ],
  'percent-change': [
    { patterns: [/divide.*new|new.*denominator|use.*new.*value/i], correction: 'Percent change is always calculated using the ORIGINAL value as the base (denominator), not the new value. Formula: (new − original) / original × 100%. Using the new value gives the wrong answer.' },
    { patterns: [/increase.*decrease.*same|back.*original|cancel.*out/i], correction: 'A percent increase followed by the same percent decrease does NOT return to the original value. Example: $100 + 20% = $120. Then $120 − 20% = $96, NOT $100. The base changes between the two calculations.' },
  ],
  'discount-tax-tip': [
    { patterns: [/two.*discount.*add|add.*discount|combine.*discount/i], correction: 'Successive discounts do NOT add up. A 20% discount then a 10% discount is NOT the same as a 30% discount. The second discount applies to the already-reduced price. Example: $100 → 20% off = $80 → 10% off = $72. But 30% off $100 = $70.' },
  ],
  'simple-interest': [
    { patterns: [/compound|interest.*on.*interest|grow.*exponential/i], correction: 'Simple interest is NOT compound interest. Simple interest is calculated only on the original principal (I = Prt). Compound interest earns interest on previously earned interest, which makes it grow faster. This skill covers simple interest only.' },
  ],
  'constant-of-proportionality': [
    { patterns: [/any.*line.*proportional|straight.*line.*proportional/i], correction: 'Not every straight line represents a proportional relationship. The line must pass through the ORIGIN (0, 0). The equation y = 3x + 2 is a straight line but is NOT proportional because when x = 0, y = 2 (not 0).' },
  ],
  'proportional-relationships': [
    { patterns: [/same.*difference.*proportional|add.*same.*proportional/i], correction: 'A constant DIFFERENCE does not make a relationship proportional. Proportional means a constant RATIO (y/x). Example: (1, 3), (2, 5), (3, 7) has a constant difference of 2, but the ratios 3/1, 5/2, 7/3 are all different — so it is NOT proportional.' },
  ],
  'direct-variation': [
    { patterns: [/any.*equation.*direct|all.*linear.*direct/i], correction: 'Not all linear equations are direct variation. Direct variation requires y = kx with NO added constant. The equation y = 2x + 3 is linear but is NOT direct variation because of the +3. In direct variation, y = 0 when x = 0.' },
  ],
  'percent-word-problems': [
    { patterns: [/percent.*of.*new|new.*price.*base/i], correction: 'Be careful about which value is the base. In markup problems, the base is the wholesale/cost price. In discount problems, the base is the original price. In percent change, the base is always the ORIGINAL value, not the new value.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHENOMENA — driving questions for phenomenon-based learning
// ═══════════════════════════════════════════════════════════════════════════════

const PHENOMENA = {
  'ratio-basics': [
    { title: 'The Perfect Lemonade', focus: 'ratios, equivalent ratios, ratio tables', text: 'A lemonade stand recipe calls for 2 cups of lemon juice for every 5 cups of water. The owner needs to make a large batch for a party using 40 cups of water, and a small cup for tasting with just 1 cup of water.', drivingQuestion: 'How much lemon juice is needed for each batch? How can you use a ratio table to scale the recipe up and down while keeping the same taste?' },
    { title: 'Trail Mix Ratios', focus: 'ratios, unit rates', text: 'A store sells trail mix by weight. Brand A has 3 parts peanuts, 2 parts raisins, and 1 part chocolate chips. Brand B has 5 parts peanuts, 3 parts raisins, and 2 parts chocolate chips.', drivingQuestion: 'Which brand has a higher ratio of chocolate chips to total mix? If you buy 300 grams of each, how many grams of chocolate chips are in each bag?' },
  ],
  'proportions': [
    { title: 'The Giant Footprint', focus: 'proportions, similar figures, scale', text: 'Students find a footprint that is 60 cm long. A classmate with a foot that is 25 cm long is 150 cm tall.', drivingQuestion: 'If the creature has the same proportions as the student, how tall would it be? Set up and solve a proportion to find out. What assumptions are you making?' },
    { title: 'Map Navigation', focus: 'scale drawings, proportions', text: 'A hiking map has a scale of 1 inch = 2.5 miles. The trail from the parking lot to the summit measures 7.2 inches on the map. The ranger says the hike takes about 4 hours.', drivingQuestion: 'How long is the actual trail? What is the average hiking speed in miles per hour? If you want to reach the summit by noon, what time should you start?' },
  ],
  'percents': [
    { title: 'Black Friday Shopping', focus: 'discount, tax, percent change', text: 'A store advertises "50% off everything!" but then adds 8% sales tax. Your friend says another store offers "40% off plus an extra 15% off the sale price" with the same tax rate. A pair of shoes costs $120 at both stores.', drivingQuestion: 'Which store offers the better deal? Calculate the final price at each store. Is "40% off plus 15% off" the same as 55% off?' },
    { title: 'The Savings Challenge', focus: 'simple interest, percent of a number', text: 'Two students each save $500. Alex puts money in Bank A at 3% simple interest. Jordan puts money in Bank B at 2.5% simple interest but also adds $10 per month.', drivingQuestion: 'After 2 years, who has more money? After how many months does Jordan overtake Alex? Set up equations for each student\'s balance over time.' },
  ],
  'applications': [
    { title: 'The Grocery Price Comparison', focus: 'constant of proportionality, proportional relationships', text: 'At Store A, 3 avocados cost $4.50, 5 cost $7.50, and 8 cost $12.00. At Store B, avocados are $1.60 each but there is a $2.00 membership fee per visit.', drivingQuestion: 'Is Store A\'s pricing a proportional relationship? Is Store B\'s? At what number of avocados does Store A become the better deal? Graph both relationships.' },
    { title: 'The Growing Plant', focus: 'direct variation, proportional relationships', text: 'A sunflower grows 2.5 cm per day in ideal conditions. After 4 days it was 10 cm tall (starting from the soil). A different plant was already 5 cm tall when measured and then grew 2.5 cm per day.', drivingQuestion: 'Does the sunflower\'s height vary directly with time? Does the second plant\'s height vary directly with time? Explain the difference using equations and graphs.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL LABS
// ═══════════════════════════════════════════════════════════════════════════════

const VIRTUAL_LABS = {
  'ratio-and-proportion': {
    title: 'Virtual Ratio & Proportion Lab',
    skills: ['understanding-ratios', 'equivalent-ratios', 'solving-proportions'],
    objective: 'Investigate how ratios and proportions relate to real-world scaling',
    background: 'Ratios compare two quantities. When two ratios are equal, they form a proportion. Proportions allow us to scale recipes, convert measurements, and solve problems involving similar shapes.',
    hypothesis_prompt: 'Predict: If a recipe uses a 2:3 ratio of sugar to flour, and you triple the recipe, will the ratio change? What if you add 1 cup to each?',
    variables: { independent: 'multiplier for recipe scaling', dependent: 'amounts of each ingredient', controlled: ['original ratio 2:3', 'measurement method'] },
    procedure: [
      { step: 1, action: 'Start with 2 cups of sugar and 3 cups of flour (ratio 2:3). Double the recipe. Record the new amounts and check if the ratio is still 2:3.' },
      { step: 2, action: 'Triple the original recipe. Record amounts. Verify the ratio.' },
      { step: 3, action: 'Now add 1 cup of sugar and 1 cup of flour to the original amounts (3 sugar, 4 flour). Is the ratio still 2:3?' },
      { step: 4, action: 'Create a ratio table for 2:3 with at least 6 entries. Graph the pairs as (sugar, flour) on a coordinate plane.' },
      { step: 5, action: 'Test: Is the point (7, 10.5) on your graph line? Is (5, 8)? How can you check without graphing?' },
    ],
    observations: {
      'double': 'Double recipe: 4 cups sugar, 6 cups flour. Ratio: 4:6 = 2:3. Same ratio!',
      'triple': 'Triple recipe: 6 cups sugar, 9 cups flour. Ratio: 6:9 = 2:3. Same ratio!',
      'add-one': 'Add 1 to each: 3 cups sugar, 4 cups flour. Ratio: 3:4 ≠ 2:3. Different ratio! Adding the same number does NOT preserve a ratio.',
      'graph': 'All equivalent ratio pairs lie on a straight line through the origin. The slope of the line is 3/2 (flour/sugar).',
      'test-points': '(7, 10.5): 10.5/7 = 1.5 = 3/2 → YES, on the line. (5, 8): 8/5 = 1.6 ≠ 1.5 → NO, not on the line.',
    },
    data_table: {
      columns: ['Sugar (cups)', 'Flour (cups)', 'Ratio (S:F)', 'Equivalent to 2:3?'],
      rows: [
        ['2', '3', '2:3', 'Yes'],
        ['4', '6', '2:3', 'Yes'],
        ['6', '9', '2:3', 'Yes'],
        ['8', '12', '2:3', 'Yes'],
        ['10', '15', '2:3', 'Yes'],
        ['3', '4', '3:4', 'No (added 1)'],
      ],
    },
    conclusion_questions: [
      'Why does multiplying both parts of a ratio by the same number keep the ratio equivalent?',
      'Why does adding the same number to both parts change the ratio?',
      'How is the graph of equivalent ratios related to proportional relationships?',
      'If you graphed a non-proportional relationship, how would the graph look different?',
      'A cookie recipe uses 2:3 sugar to flour. You need 12 cups of flour. Set up and solve a proportion to find the sugar needed.',
    ],
  },
  'unit-rates': {
    title: 'Virtual Unit Rates Comparison Lab',
    skills: ['unit-rates', 'constant-of-proportionality', 'proportional-relationships'],
    objective: 'Compare unit rates from different sources and determine which represents the best value',
    background: 'A unit rate describes the amount of one quantity per one unit of another quantity. Comparing unit rates helps us make smart consumer decisions. If a relationship is proportional, the unit rate is the constant of proportionality.',
    hypothesis_prompt: 'Predict: Store A sells 6 muffins for $9.00 and Store B sells 4 muffins for $5.80. Which store has the better deal? Will the cheaper store always be cheaper regardless of quantity?',
    variables: { independent: 'store and quantity purchased', dependent: 'total cost', controlled: ['same product (muffins)', 'same quality assumed'] },
    procedure: [
      { step: 1, action: 'Calculate the unit rate (price per muffin) for Store A (6 for $9.00) and Store B (4 for $5.80).' },
      { step: 2, action: 'Calculate the total cost for 1, 4, 6, 8, 12, and 24 muffins at each store.' },
      { step: 3, action: 'Graph both stores on the same coordinate plane (muffins on x-axis, cost on y-axis).' },
      { step: 4, action: 'Determine if each store\'s pricing is a proportional relationship. Find the constant of proportionality.' },
      { step: 5, action: 'Store C offers 10 muffins for $13.50. Add Store C to your comparison.' },
    ],
    observations: {
      'unit-rates': 'Store A: $9.00 ÷ 6 = $1.50 per muffin. Store B: $5.80 ÷ 4 = $1.45 per muffin. Store B is slightly cheaper per muffin.',
      'cost-table': '12 muffins: Store A = $18.00, Store B = $17.40. 24 muffins: Store A = $36.00, Store B = $34.80. Store B is always cheaper.',
      'graph': 'Both graphs are straight lines through the origin. Store B has a slightly less steep line (lower unit rate = lower cost).',
      'proportionality': 'Both are proportional relationships. Store A: k = 1.50, equation c = 1.50m. Store B: k = 1.45, equation c = 1.45m.',
      'store-c': 'Store C: $13.50 ÷ 10 = $1.35 per muffin. Store C has the best unit rate!',
    },
    data_table: {
      columns: ['Muffins', 'Store A ($1.50/ea)', 'Store B ($1.45/ea)', 'Store C ($1.35/ea)'],
      rows: [
        ['1', '$1.50', '$1.45', '$1.35'],
        ['4', '$6.00', '$5.80', '$5.40'],
        ['6', '$9.00', '$8.70', '$8.10'],
        ['8', '$12.00', '$11.60', '$10.80'],
        ['12', '$18.00', '$17.40', '$16.20'],
        ['24', '$36.00', '$34.80', '$32.40'],
      ],
    },
    conclusion_questions: [
      'Which store offers the best deal? How did you determine this?',
      'Are all three stores\' pricing proportional relationships? How do you know?',
      'What is the constant of proportionality for each store, and what does it represent in context?',
      'If you had $20, how many muffins could you buy at each store?',
      'A fourth store charges $2.00 per muffin but gives a $3.00 coupon on any purchase. Is this proportional? At what number of muffins does this store become the best deal?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGRAMS — ASCII diagrams for key concepts
// ═══════════════════════════════════════════════════════════════════════════════

const DIAGRAMS_LOCAL = {
  'ratio-table-basic': {
    domain: 'ms-math-ratios',
    skill: 'ratio-tables',
    topic: 'Reading a Ratio Table',
    description: 'A ratio table for the ratio 3:5 with blanks to fill in.',
    diagram: `
  ┌──────────┬────┬────┬────┬────┬────┐
  │  Apples  │  3 │  6 │ [A]│ 12 │ 15 │
  ├──────────┼────┼────┼────┼────┼────┤
  │  Oranges │  5 │ [B]│ 15 │ [C]│ 25 │
  └──────────┴────┴────┴────┴────┴────┘

  Fill in the blanks:
  [A] = ___
  [B] = ___
  [C] = ___
  What is the ratio of Apples to Oranges? ___
`,
    labels: { A: '9', B: '10', C: '20', 'ratio': '3:5' },
  },
  'tape-diagram': {
    domain: 'ms-math-ratios',
    skill: 'understanding-ratios',
    topic: 'Tape Diagram for Ratios',
    description: 'A tape diagram showing a 2:3 ratio of boys to girls in a class of 25.',
    diagram: `
  Boys:   [████][████]
  Girls:  [████][████][████]

  Each block = [A] students
  Total students = [B]
  Number of boys = [C]
  Number of girls = [D]

  Fill in:
  [A] = ___
  [B] = ___
  [C] = ___
  [D] = ___
`,
    labels: { A: '5', B: '25', C: '10', D: '15' },
  },
  'percent-bar-model': {
    domain: 'ms-math-ratios',
    skill: 'percent-of-a-number',
    topic: 'Percent Bar Model',
    description: 'A bar model showing 25% of 80.',
    diagram: `
  0%          25%          50%          75%          100%
  |──────[A]──|────────────|────────────|────────────|
  0          [B]          [C]          [D]           80

  Fill in the values:
  [A] = ___% of 80
  [B] = ___
  [C] = ___
  [D] = ___
`,
    labels: { A: '25', B: '20', C: '40', D: '60' },
  },
  'proportional-graph': {
    domain: 'ms-math-ratios',
    skill: 'proportional-relationships',
    topic: 'Graph of a Proportional Relationship',
    description: 'A coordinate graph showing a proportional relationship y = 2.5x.',
    diagram: `
  y
  25 |              •
     |            /
  20 |          • [C]
     |        /
  15 |      •
     |    /
  10 |  • [B]
     |/
   5 • [A]
     |
   0 +--+--+--+--+--+--→ x
     0  2  4  6  8  10

  Point [A] coordinates: (__, __)
  Point [B] coordinates: (__, __)
  Point [C] coordinates: (__, __)
  Constant of proportionality k = ___
  Equation: y = ___
`,
    labels: { A: '(2, 5)', B: '(4, 10)', C: '(8, 20)', 'k': '2.5', 'equation': 'y = 2.5x' },
  },
  'scale-drawing-rectangle': {
    domain: 'ms-math-ratios',
    skill: 'scale-drawings',
    topic: 'Scale Drawing of a Room',
    description: 'A scale drawing of a rectangular room with scale 1 cm = 3 m.',
    diagram: `
  Scale: 1 cm = 3 m

  ┌─────────────────┐
  │                 │
  │    4 cm         │  [A] cm
  │                 │
  └─────────────────┘

  Drawing length: 4 cm
  Drawing width: [A] cm = 2 cm

  Actual length [B]: ___ m
  Actual width [C]: ___ m
  Actual area [D]: ___ m²
`,
    labels: { A: '2', B: '12', C: '6', D: '72' },
  },
  'discount-tax-diagram': {
    domain: 'ms-math-ratios',
    skill: 'discount-tax-tip',
    topic: 'Discount Then Tax Calculation',
    description: 'A step-by-step diagram showing how to calculate a discounted price with tax.',
    diagram: `
  Original Price: $80.00
        │
        ▼  [A]% discount
  ──────────────────
  Discount amount: $[B]
        │
        ▼
  Sale Price: $[C]
        │
        ▼  + 7% tax
  ──────────────────
  Tax amount: $[D]
        │
        ▼
  Final Price: $[E]

  [A] = ___
  [B] = ___
  [C] = ___
  [D] = ___
  [E] = ___
`,
    labels: { A: '25', B: '20', C: '60', D: '4.20', E: '64.20' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CER PHENOMENA — Claim-Evidence-Reasoning writing prompts
// ═══════════════════════════════════════════════════════════════════════════════

const CER_PHENOMENA_LOCAL = {
  'best-buy-comparison': {
    domain: 'ms-math-ratios',
    title: 'Which Cereal is the Better Buy?',
    phenomenon: 'At the grocery store, a 12 oz box of cereal costs $3.60 and a 20 oz box of the same cereal costs $5.40. A shopper grabs the smaller box saying "It\'s cheaper!" Another shopper says the bigger box is actually the better deal.',
    scaffold: {
      claim: 'Make a claim about which box of cereal is the better buy.',
      evidence: 'Calculate the unit price for each box. What do the numbers show?',
      reasoning: 'Use the concept of unit rates to explain why comparing total price alone is not enough to determine the better buy.',
    },
    keyTerms: ['unit rate', 'unit price', 'ratio', 'per ounce', 'proportion', 'comparison'],
    rubric: {
      claim: { excellent: 'States that the 20 oz box is the better buy because it has a lower unit price', adequate: 'States the larger box is better', developing: 'Vague or incorrect claim' },
      evidence: { excellent: 'Calculates both unit prices ($0.30/oz vs $0.27/oz) and compares them', adequate: 'Calculates at least one unit price', developing: 'No calculations or incorrect math' },
      reasoning: { excellent: 'Explains that unit rate standardizes the comparison to per-one-unit, making a fair comparison regardless of package size', adequate: 'Mentions unit price is important', developing: 'Incomplete connection between evidence and claim' },
    },
  },
  'shrinkflation': {
    domain: 'ms-math-ratios',
    title: 'The Incredible Shrinking Candy Bar',
    phenomenon: 'A candy company kept the price of their chocolate bar at $1.50 but reduced the size from 4 oz to 3.2 oz. The packaging looks almost identical. Many customers did not notice the change.',
    scaffold: {
      claim: 'Make a claim about the effective percent price increase the customers are paying.',
      evidence: 'Calculate the unit price before and after the size change. What is the percent change?',
      reasoning: 'Use percent change and unit rate concepts to explain why this is essentially a hidden price increase.',
    },
    keyTerms: ['percent change', 'unit rate', 'unit price', 'ratio', 'proportion', 'increase'],
    rubric: {
      claim: { excellent: 'States that the effective price increased by 25% because the unit price went from $0.375/oz to $0.469/oz', adequate: 'States there was a price increase', developing: 'Vague or missing claim' },
      evidence: { excellent: 'Calculates both unit prices and the percent change (25% increase)', adequate: 'Calculates the size decrease (20%) but not the price per ounce change', developing: 'Limited or no calculations' },
      reasoning: { excellent: 'Connects the size reduction to an effective price increase using percent change formula with the original unit price as the base', adequate: 'Explains that less product for the same price means higher cost per unit', developing: 'Incomplete reasoning' },
    },
  },
  'tip-calculation': {
    domain: 'ms-math-ratios',
    title: 'Fair Tips at a Restaurant',
    phenomenon: 'At a restaurant, one table of 2 people has a $30 bill and leaves a $6 tip. Another table of 6 people has a $120 bill and also leaves a $6 tip. The server says the second table "barely tipped."',
    scaffold: {
      claim: 'Make a claim about whether both tables tipped fairly and what "fair" means mathematically.',
      evidence: 'Calculate the tip percentage for each table. How do they compare?',
      reasoning: 'Use the concept of percent to explain why the same dollar amount can represent very different levels of generosity.',
    },
    keyTerms: ['percent', 'ratio', 'proportion', 'percent of a number', 'tip', 'base'],
    rubric: {
      claim: { excellent: 'States that the first table tipped 20% which is generous but the second tipped only 5% which is below the customary 15-20%', adequate: 'States the second table tipped less', developing: 'Claims both tipped the same because both left $6' },
      evidence: { excellent: 'Calculates 6/30 = 20% and 6/120 = 5% and compares to standard tipping norms', adequate: 'Calculates at least one percentage', developing: 'No calculations' },
      reasoning: { excellent: 'Explains that the dollar amount of a tip must be evaluated as a percent of the total bill because the base amount matters', adequate: 'Mentions percent is important for comparison', developing: 'Incomplete reasoning' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIOS — real-world application scenarios for lessons
// ═══════════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { title: 'Cooking for a Crowd', focus: 'ratios, equivalent ratios, ratio tables, proportions', text: 'A cookie recipe serves 24 people and calls for 3 cups of flour, 2 cups of sugar, and 1 cup of butter. You need to make cookies for 60 people. Set up proportions to determine how much of each ingredient you need. Then determine amounts for just 8 people. Create a ratio table showing all three batch sizes.' },
  { title: 'Road Trip Planning', focus: 'unit rates, proportional relationships, direct variation', text: 'Your family is driving 450 miles to visit relatives. The car gets 30 miles per gallon and gas costs $3.60 per gallon. Calculate the total gas cost. If you drive at an average of 60 mph, how long will the trip take? Is the relationship between gallons used and miles driven proportional? What is k?' },
  { title: 'School Budget Analysis', focus: 'percents, percent of a number, percent word problems', text: 'A school has a $200,000 budget. They allocate 45% to teacher salaries, 20% to facilities, 15% to technology, 12% to supplies, and the rest to extracurriculars. Calculate the dollar amount for each category. If the budget increases by 5% next year, what is each category\'s new allocation?' },
  { title: 'The Shopping Spree', focus: 'discount, tax, tip, percent change', text: 'You have $100 to spend. Shirt: $35 (20% off). Jeans: $50 (buy one get one 50% off — you only need one pair). Shoes: $45 (15% off). Sales tax is 7%. Do you have enough money? Calculate the total cost step by step.' },
  { title: 'Model Building', focus: 'scale drawings, similar figures, proportions', text: 'You are building a 1:87 scale model of a city block. The real buildings are: School (40 m tall, 100 m long), House (8 m tall, 15 m long), Water tower (25 m tall). Calculate the height and length of each building in your model in centimeters. If you make the school 2 cm tall instead, what scale are you using?' },
  { title: 'Savings Plan', focus: 'simple interest, percent, proportional relationships', text: 'You earn $12/hour babysitting and save 40% of your earnings. You put savings into an account earning 3% simple annual interest. If you babysit 10 hours per week, how much do you save per month? How much interest do you earn in one year on your first month\'s savings? How long until your savings plus interest reach $1000?' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY — key terms per skill category
// ═══════════════════════════════════════════════════════════════════════════════

const VOCABULARY = {
  'ratio-basics': [
    { term: 'ratio', definition: 'A comparison of two quantities by division, written as a:b, a to b, or a/b.' },
    { term: 'equivalent ratios', definition: 'Ratios that express the same relationship between two quantities (e.g., 2:3 and 4:6).' },
    { term: 'ratio table', definition: 'A table of equivalent ratios used to find missing values in proportional relationships.' },
    { term: 'unit rate', definition: 'A rate in which the second quantity is one unit (e.g., $3 per pound, 60 miles per hour).' },
    { term: 'rate', definition: 'A ratio that compares two quantities with different units.' },
    { term: 'simplest form', definition: 'A ratio or fraction where the greatest common factor (GCF) of both terms is 1.' },
    { term: 'tape diagram', definition: 'A visual model using rectangular bars to represent parts of a ratio.' },
  ],
  'proportions': [
    { term: 'proportion', definition: 'An equation stating that two ratios are equal (e.g., 2/3 = 4/6).' },
    { term: 'cross-multiplication', definition: 'A method for solving proportions by multiplying the numerator of each ratio by the denominator of the other.' },
    { term: 'scale', definition: 'The ratio of a measurement in a drawing or model to the actual measurement.' },
    { term: 'scale factor', definition: 'The ratio of corresponding lengths in similar figures.' },
    { term: 'scale drawing', definition: 'A proportional two-dimensional representation of an object.' },
    { term: 'similar figures', definition: 'Figures that have the same shape but not necessarily the same size; corresponding angles are equal and sides are proportional.' },
    { term: 'corresponding sides', definition: 'Sides in the same relative position in similar figures.' },
  ],
  'percents': [
    { term: 'percent', definition: 'A ratio that compares a number to 100. The symbol % means "per hundred."' },
    { term: 'percent of a number', definition: 'The result of multiplying a decimal form of a percent by a given number.' },
    { term: 'percent change', definition: 'The ratio of the amount of change to the original amount, expressed as a percent.' },
    { term: 'percent increase', definition: 'A percent change where the new value is greater than the original value.' },
    { term: 'percent decrease', definition: 'A percent change where the new value is less than the original value.' },
    { term: 'discount', definition: 'A reduction in the original price of an item, usually expressed as a percent.' },
    { term: 'markup', definition: 'An increase added to the cost price to determine the selling price.' },
    { term: 'sales tax', definition: 'A percent of the purchase price added by the government.' },
    { term: 'tip (gratuity)', definition: 'An amount of money given for a service, usually calculated as a percent of the bill.' },
    { term: 'simple interest', definition: 'Interest calculated only on the original principal using the formula I = Prt.' },
    { term: 'principal', definition: 'The original amount of money deposited or borrowed.' },
  ],
  'applications': [
    { term: 'constant of proportionality', definition: 'The constant value k in the equation y = kx that relates two proportional quantities.' },
    { term: 'proportional relationship', definition: 'A relationship between two quantities where the ratio y/x is constant and the graph is a straight line through the origin.' },
    { term: 'direct variation', definition: 'A relationship where y = kx for some nonzero constant k; y varies directly with x.' },
    { term: 'origin', definition: 'The point (0, 0) on a coordinate plane.' },
    { term: 'linear relationship', definition: 'A relationship that can be represented by a straight line on a graph.' },
    { term: 'commission', definition: 'A payment based on a percent of total sales.' },
    { term: 'depreciation', definition: 'A decrease in value over time, often expressed as a percent per year.' },
  ],
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

class MSMathRatios extends DomainSkillBase {
  constructor() {
    super('ms-math-ratios', 'ms-math-ratios', DATA_DIR, loadProfile, saveProfile, HINT_BANKS);
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
        if (m < MASTERY_THRESHOLD && _ratiosTopicUnlocked(sk, p.skills)) {
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
        const isUnlocked = _ratiosTopicUnlocked(sk, p.skills);
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
    if (!target) return { message: 'All ratios, proportions & percents skills are proficient!', congratulations: true };
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
        apply: scenario ? `Analyze scenario: "${scenario.title}"` : 'Connect to real-world ratio and percent applications',
        extend: `Connect ${target.skill} to related math concepts`,
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
    if (!name) return { labs: Object.keys(VIRTUAL_LABS), instructions: 'node ratios.js lab <id> <lab-name> [obs-key]' };
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

  getVocabulary(category) {
    if (!category) {
      const all = {};
      for (const [cat, terms] of Object.entries(VOCABULARY)) {
        all[cat] = terms.map(t => t.term);
      }
      return { categories: all };
    }
    const terms = VOCABULARY[category];
    if (!terms) return { error: `Unknown category: ${category}. Available: ${Object.keys(VOCABULARY).join(', ')}` };
    return { category, terms };
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
      message: due.length === 0 ? 'No ratio/proportion/percent skills due for review today!' : `${due.length} skill(s) need review. Work through each exercise below.`,
    };
  }
}

module.exports = MSMathRatios;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI: node ratios.js <command> [args]
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const api = new MSMathRatios();
  const common = buildCommonCLIHandlers(api, DATA_DIR, 'ms-math-ratios', loadProfile, saveProfile);
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
        try { ans = JSON.parse(answersJson); } catch { throw new Error("answers-json must be valid JSON e.g. '{\"A\":\"9\"}'"); }
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
      case 'vocab': {
        const [, id, category] = args;
        if (!id) throw new Error('Usage: vocab <id> [category]');
        out(api.getVocabulary(category || null));
        break;
      }
      case 'scenario': {
        out(api.getScenario());
        break;
      }
      case 'help': out({
        skill: 'ms-math-ratios',
        gradeLevel: '6-8',
        standards: 'CCSS 6.RP, 7.RP',
        usage: 'node ratios.js <command> [args]',
        commands: {
          'start <id>': 'Start a student session; includes last session state for resume prompt',
          'resume <id>': 'Resume last session or offer to start fresh if >24h old',
          'lesson <id>': 'Generate a lesson with concept explanation and exercises',
          'exercise <id> [skill]': 'Generate 5 practice items; optionally filter by skill',
          'check <id> <type> <expected> <answer> [skill]': 'Check an answer; returns misconception feedback if wrong',
          'record <id> <skill> <score> <total> [hints] [notes]': 'Save a scored assessment attempt',
          'progress <id>': 'Show mastery levels across all ratio/proportion/percent skills',
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
          'vocab <id> [topic]': 'Pre-teach ratio/proportion/percent vocabulary',
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
        usage: 'node ratios.js <command> [args]',
        commands: ['start', 'resume', 'lesson', 'exercise', 'check', 'record', 'progress', 'report', 'next', 'catalog', 'students', 'review', 'hint', 'hint-reset', 'lab', 'diagram', 'diagram-check', 'cer', 'cer-check', 'cer-history', 'vocab', 'phenomenon', 'scenario', 'profile', 'standards', 'socratic', 'socratic-record', 'suggest-next', 'progression', 'help'],
      });
    }
  });
}
