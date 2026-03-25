// eClaw MS Math Data & Probability Tutor (6-8).
// CCSS Statistics & Probability (6.SP, 7.SP, 8.SP) aligned.

const { dataDir, loadProfile: _lp, saveProfile: _sp, listProfiles, calcMastery, masteryLabel, shuffle, pick, runCLI, srGrade, srUpdate, srEffectiveMastery, srDueToday, MASTERY_THRESHOLD, saveSessionState, loadSessionState, fsrsUpdateStability, fsrsUpdateDifficulty, fsrsNextReview, today } = require('../_lib/core');
const { buildDiffContext } = require('../_lib/differentiation');
const { DomainSkillBase, buildCommonCLIHandlers, generateExercise: _generateExercise, checkAnswer: _checkAnswer } = require('../_lib/exercise-factory');

const DATA_DIR = dataDir('ms-math-data');
const loadProfile = id => _lp(DATA_DIR, id);
const saveProfile = p => _sp(DATA_DIR, p);

const SKILLS = {
  'statistical-measures': ['mean', 'median', 'mode', 'range', 'mean-absolute-deviation'],
  'data-displays': ['dot-plots', 'histograms', 'box-plots', 'scatter-plots', 'line-of-best-fit'],
  'probability-basics': ['theoretical-probability', 'experimental-probability', 'compound-events', 'independent-dependent-events'],
  'sampling-inference': ['random-sampling', 'making-inferences', 'comparing-populations', 'two-way-tables'],
};

// Prerequisites: topic → [topics that must be mastered first].
const TOPIC_PREREQUISITES = {
  // statistical-measures (foundational)
  'mean': [],
  'median': [],
  'mode': [],
  'range': ['mean'],
  'mean-absolute-deviation': ['mean', 'range'],
  // data-displays
  'dot-plots': ['mean', 'median', 'mode'],
  'histograms': ['dot-plots', 'range'],
  'box-plots': ['median', 'range'],
  'scatter-plots': ['dot-plots'],
  'line-of-best-fit': ['scatter-plots'],
  // probability-basics
  'theoretical-probability': ['range'],
  'experimental-probability': ['theoretical-probability'],
  'compound-events': ['theoretical-probability'],
  'independent-dependent-events': ['compound-events'],
  // sampling-inference
  'random-sampling': ['mean', 'median'],
  'making-inferences': ['random-sampling', 'mean-absolute-deviation'],
  'comparing-populations': ['making-inferences', 'box-plots'],
  'two-way-tables': ['making-inferences'],
};

// Helper: is a topic unlocked (all prereqs mastered)?
function _dataTopicUnlocked(topic, profileSkills) {
  return (TOPIC_PREREQUISITES[topic] || []).every(r => (profileSkills[r]?.mastery || 0) >= MASTERY_THRESHOLD);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANKS — 8 questions per skill, CCSS Statistics & Probability aligned
// ═══════════════════════════════════════════════════════════════════════════════

const QUESTION_BANKS = {
  // ── statistical-measures ──────────────────────────────────────────────────
  'mean': { questions: [
    { q: 'Find the mean of: 4, 8, 6, 10, 12', a: '8', type: 'short', difficulty: 1 },
    { q: 'What does the mean represent?', a: 'the average of a set of numbers found by adding all values and dividing by the count', type: 'short', difficulty: 1 },
    { q: 'Find the mean of: 3, 7, 5, 9, 11, 1', a: '6', type: 'short', difficulty: 1 },
    { q: 'True or false: The mean is always one of the numbers in the data set.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A student scored 80, 90, 85, 75, and 95 on five tests. What is the mean score?', a: '85', type: 'short', difficulty: 1 },
    { q: 'The mean of five numbers is 12. What is the sum of the five numbers?', a: '60', type: 'short', difficulty: 2 },
    { q: 'The mean of 3, 5, 7, and x is 6. What is x?', a: '9', type: 'short', difficulty: 3 },
    { q: 'A data set has a mean of 50. If you add a new value of 50, what happens to the mean?', a: ['it stays the same', 'the mean stays 50', 'stays the same'], type: 'multi', difficulty: 2 },
  ]},
  'median': { questions: [
    { q: 'Find the median of: 3, 7, 1, 9, 5', a: '5', type: 'short', difficulty: 1 },
    { q: 'What is the median of a data set?', a: 'the middle value when the data is arranged in order', type: 'short', difficulty: 1 },
    { q: 'Find the median of: 2, 8, 4, 10, 6, 12', a: '7', type: 'short', difficulty: 2 },
    { q: 'True or false: The median is always affected by extreme values (outliers).', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'Find the median of: 15, 20, 35, 40, 50', a: '35', type: 'short', difficulty: 1 },
    { q: 'A data set is: 1, 2, 3, 4, 5, 100. Which is a better measure of center: mean or median? Why?', a: 'median because it is not affected by the outlier 100', type: 'open', difficulty: 3 },
    { q: 'Seven students scored: 70, 75, 80, 85, 90, 90, 95. What is the median score?', a: '85', type: 'short', difficulty: 1 },
    { q: 'True or false: To find the median, you must first put the numbers in order.', a: 'true', type: 'tf', difficulty: 1 },
  ]},
  'mode': { questions: [
    { q: 'Find the mode of: 2, 3, 3, 5, 7, 3, 8', a: '3', type: 'short', difficulty: 1 },
    { q: 'What is the mode of a data set?', a: 'the value that appears most frequently', type: 'short', difficulty: 1 },
    { q: 'Find the mode of: 1, 2, 2, 3, 3, 4', a: ['2 and 3', 'both 2 and 3'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A data set can have more than one mode.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the mode of: 5, 10, 15, 20, 25?', a: ['no mode', 'there is no mode', 'none'], type: 'multi', difficulty: 2 },
    { q: 'In a survey, students chose their favorite color: red (8), blue (12), green (5), yellow (3). What is the mode?', a: 'blue', type: 'short', difficulty: 1 },
    { q: 'True or false: The mode is useful for categorical data like favorite color or pet type.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A shoe store tracks sizes sold: 7, 8, 8, 9, 9, 9, 10, 10, 11. Which size should they stock the most of, and why?', a: 'size 9 because it is the mode and was sold most often', type: 'open', difficulty: 2 },
  ]},
  'range': { questions: [
    { q: 'Find the range of: 3, 7, 1, 9, 5', a: '8', type: 'short', difficulty: 1 },
    { q: 'What does the range measure?', a: 'the spread of data by finding the difference between the greatest and least values', type: 'short', difficulty: 1 },
    { q: 'A class took a test. Scores: 55, 70, 75, 80, 95. What is the range?', a: '40', type: 'short', difficulty: 1 },
    { q: 'True or false: The range uses all the values in the data set to measure spread.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'Data set A: 10, 20, 30, 40, 50. Data set B: 28, 29, 30, 31, 32. Which has a greater range?', a: ['data set A', 'A'], type: 'multi', difficulty: 1 },
    { q: 'The temperatures for one week were: 68, 72, 65, 80, 74, 71, 69. What is the range?', a: '15', type: 'short', difficulty: 2 },
    { q: 'If you add a very large outlier to a data set, what happens to the range?', a: ['it increases', 'the range gets larger', 'it gets bigger'], type: 'multi', difficulty: 2 },
    { q: 'Why is the range considered a weak measure of variability?', a: 'because it only uses two values the maximum and minimum and is greatly affected by outliers', type: 'open', difficulty: 3 },
  ]},
  'mean-absolute-deviation': { questions: [
    { q: 'What does mean absolute deviation (MAD) measure?', a: 'the average distance of each data point from the mean', type: 'short', difficulty: 1 },
    { q: 'Data: 2, 4, 6, 8, 10. The mean is 6. Find the MAD.', a: ['2.4', '2.4'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A smaller MAD means the data is more spread out.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'What is the first step in calculating the MAD?', a: ['find the mean', 'calculate the mean of the data set'], type: 'multi', difficulty: 1 },
    { q: 'Data set: 10, 10, 10, 10, 10. What is the MAD?', a: '0', type: 'short', difficulty: 1 },
    { q: 'If two data sets have the same mean but different MAD values, which data set with the larger MAD is more spread out or less spread out?', a: 'more spread out', type: 'short', difficulty: 2 },
    { q: 'Data: 5, 5, 5, 5, 20. The mean is 8. Find the MAD.', a: '4.8', type: 'short', difficulty: 3 },
    { q: 'Explain in your own words why we take the absolute value of the deviations when computing MAD.', a: 'because positive and negative deviations would cancel each other out and the total would be zero', type: 'open', difficulty: 3 },
  ]},

  // ── data-displays ─────────────────────────────────────────────────────────
  'dot-plots': { questions: [
    { q: 'What is a dot plot?', a: 'a graph that shows each data value as a dot above a number line', type: 'short', difficulty: 1 },
    { q: 'True or false: A dot plot is useful for showing the shape and spread of small data sets.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'On a dot plot, a column of 5 dots above the number 8 means what?', a: ['the value 8 appears 5 times', '5 data points have the value 8', 'there are 5 eights'], type: 'multi', difficulty: 1 },
    { q: 'How do you find the mode from a dot plot?', a: 'look for the value with the tallest stack of dots', type: 'short', difficulty: 1 },
    { q: 'A dot plot shows: 1 dot above 3, 3 dots above 4, 2 dots above 5, and 1 dot above 7. What is the total number of data points?', a: '7', type: 'short', difficulty: 2 },
    { q: 'Using the same dot plot (1 dot above 3, 3 dots above 4, 2 dots above 5, 1 dot above 7), what is the median?', a: '4', type: 'short', difficulty: 2 },
    { q: 'What does a gap in a dot plot indicate?', a: ['no data values at that point', 'that value does not appear in the data set'], type: 'multi', difficulty: 2 },
    { q: 'When would a dot plot be a better choice than a histogram?', a: 'when the data set is small and you want to see individual values', type: 'open', difficulty: 3 },
  ]},
  'histograms': { questions: [
    { q: 'What is a histogram?', a: 'a bar graph that shows the frequency of data within equal intervals or bins', type: 'short', difficulty: 1 },
    { q: 'True or false: In a histogram, the bars touch each other.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'How is a histogram different from a bar graph?', a: 'a histogram shows numerical data grouped in intervals while a bar graph shows categorical data', type: 'short', difficulty: 2 },
    { q: 'A histogram has bins 0-9, 10-19, 20-29. The bar for 10-19 has a height of 8. What does that mean?', a: '8 data values fall between 10 and 19', type: 'short', difficulty: 1 },
    { q: 'True or false: You can determine the exact data values from a histogram.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A histogram shows test scores: 60-69 (2 students), 70-79 (5), 80-89 (8), 90-100 (3). How many students took the test?', a: '18', type: 'short', difficulty: 2 },
    { q: 'What shape does a histogram have if most data is on the left with a long tail to the right?', a: ['skewed right', 'right-skewed', 'positively skewed'], type: 'multi', difficulty: 2 },
    { q: 'A student wants to display the ages of 200 people at a concert. Should they use a dot plot or a histogram? Explain.', a: 'a histogram because the data set is large and it is better to group ages into intervals', type: 'open', difficulty: 3 },
  ]},
  'box-plots': { questions: [
    { q: 'What five values does a box plot display?', a: ['minimum, Q1, median, Q3, maximum', 'min Q1 median Q3 max', 'the five-number summary'], type: 'multi', difficulty: 1 },
    { q: 'What does the box in a box plot represent?', a: 'the middle 50% of the data between Q1 and Q3', type: 'short', difficulty: 1 },
    { q: 'True or false: The line inside the box of a box plot represents the mean.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A box plot has Q1 = 20 and Q3 = 50. What is the interquartile range (IQR)?', a: '30', type: 'short', difficulty: 1 },
    { q: 'What does a long whisker on the right side of a box plot indicate?', a: ['the data is spread out on the high end', 'there are values far above Q3', 'the data is skewed right'], type: 'multi', difficulty: 2 },
    { q: 'Two box plots compare class A and class B test scores. Class A has a wider box. What does this tell you?', a: 'class A has more variability in the middle 50% of scores', type: 'short', difficulty: 2 },
    { q: 'A box plot has min = 10, Q1 = 25, median = 40, Q3 = 55, max = 90. What is the IQR?', a: '30', type: 'short', difficulty: 2 },
    { q: 'Explain why box plots are useful for comparing two data sets.', a: 'they show the center spread and shape of each data set side by side making it easy to compare medians and variability', type: 'open', difficulty: 3 },
  ]},
  'scatter-plots': { questions: [
    { q: 'What is a scatter plot used for?', a: 'to show the relationship between two numerical variables', type: 'short', difficulty: 1 },
    { q: 'If a scatter plot shows points going up from left to right, what type of correlation is this?', a: 'positive correlation', type: 'short', difficulty: 1 },
    { q: 'If a scatter plot shows points going down from left to right, what type of correlation is this?', a: 'negative correlation', type: 'short', difficulty: 1 },
    { q: 'True or false: Correlation means that one variable causes the other to change.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A scatter plot of study hours vs. test scores shows points loosely scattered with no clear pattern. What type of correlation is this?', a: ['no correlation', 'none', 'no association'], type: 'multi', difficulty: 2 },
    { q: 'What does a cluster of points on a scatter plot indicate?', a: ['a group of data points with similar values', 'many data points are close together in that region'], type: 'multi', difficulty: 2 },
    { q: 'A scatter plot of temperature vs. ice cream sales shows a strong positive trend. Does this prove temperature causes ice cream sales to increase?', a: 'no because correlation does not prove causation there could be other factors', type: 'open', difficulty: 3 },
    { q: 'What is an outlier on a scatter plot?', a: 'a data point that is far away from the overall pattern of the other points', type: 'short', difficulty: 2 },
  ]},
  'line-of-best-fit': { questions: [
    { q: 'What is a line of best fit?', a: 'a straight line drawn through a scatter plot that best represents the overall trend of the data', type: 'short', difficulty: 1 },
    { q: 'True or false: A line of best fit must pass through every data point.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'What does the slope of a line of best fit tell you?', a: 'the rate of change or how much y changes for each unit increase in x', type: 'short', difficulty: 2 },
    { q: 'If a line of best fit has a negative slope, what kind of association exists between the variables?', a: ['negative', 'negative association', 'negative correlation'], type: 'multi', difficulty: 1 },
    { q: 'A line of best fit is y = 2x + 10. Predict the y-value when x = 5.', a: '20', type: 'short', difficulty: 2 },
    { q: 'True or false: Using a line of best fit to predict values far outside the data range is always reliable.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A line of best fit is y = -3x + 100. If x increases by 1, how does y change?', a: ['y decreases by 3', 'it decreases by 3', '-3'], type: 'multi', difficulty: 2 },
    { q: 'Explain why two students might draw slightly different lines of best fit on the same scatter plot.', a: 'because the line of best fit is an estimate and there is some subjectivity in drawing it by hand as long as it follows the overall trend', type: 'open', difficulty: 3 },
  ]},

  // ── probability-basics ────────────────────────────────────────────────────
  'theoretical-probability': { questions: [
    { q: 'What is the probability of rolling a 3 on a standard die?', a: '1/6', type: 'short', difficulty: 1 },
    { q: 'What is theoretical probability?', a: 'the expected probability based on mathematical reasoning and equally likely outcomes', type: 'short', difficulty: 1 },
    { q: 'A bag has 3 red, 2 blue, and 5 green marbles. What is the probability of drawing a blue marble?', a: ['2/10', '1/5'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A probability of 0 means the event is impossible.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the probability of flipping heads on a fair coin?', a: ['1/2', '0.5', '50%'], type: 'multi', difficulty: 1 },
    { q: 'A spinner has 8 equal sections numbered 1 through 8. What is the probability of landing on an even number?', a: ['4/8', '1/2', '0.5'], type: 'multi', difficulty: 2 },
    { q: 'What is the probability of rolling a number greater than 4 on a standard die?', a: ['2/6', '1/3'], type: 'multi', difficulty: 2 },
    { q: 'A deck of cards has 52 cards. What is the probability of drawing an ace?', a: ['4/52', '1/13'], type: 'multi', difficulty: 2 },
  ]},
  'experimental-probability': { questions: [
    { q: 'What is experimental probability?', a: 'the probability based on the results of an actual experiment or trial', type: 'short', difficulty: 1 },
    { q: 'A coin is flipped 50 times and lands on heads 28 times. What is the experimental probability of heads?', a: ['28/50', '14/25', '0.56'], type: 'multi', difficulty: 1 },
    { q: 'True or false: Experimental probability always equals theoretical probability.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'How do you calculate experimental probability?', a: 'divide the number of times the event occurred by the total number of trials', type: 'short', difficulty: 1 },
    { q: 'A basketball player made 18 free throws out of 25 attempts. What is the experimental probability of making a free throw?', a: ['18/25', '0.72', '72%'], type: 'multi', difficulty: 2 },
    { q: 'As the number of trials in an experiment increases, what happens to the experimental probability?', a: ['it gets closer to the theoretical probability', 'it approaches the theoretical probability'], type: 'multi', difficulty: 2 },
    { q: 'A die is rolled 60 times. The number 4 appears 15 times. What is the experimental probability of rolling a 4? How does it compare to the theoretical probability?', a: 'experimental is 15/60 or 1/4 which is greater than the theoretical of 1/6', type: 'open', difficulty: 3 },
    { q: 'Why might experimental probability differ from theoretical probability?', a: 'because of random variation in a limited number of trials', type: 'short', difficulty: 2 },
  ]},
  'compound-events': { questions: [
    { q: 'What is a compound event?', a: 'an event that consists of two or more simple events', type: 'short', difficulty: 1 },
    { q: 'What is the probability of flipping a coin and getting heads AND rolling a die and getting a 6?', a: ['1/12'], type: 'multi', difficulty: 2 },
    { q: 'True or false: The probability of two independent events both happening is found by multiplying their individual probabilities.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'You roll a die and flip a coin. How many outcomes are in the sample space?', a: '12', type: 'short', difficulty: 1 },
    { q: 'A spinner has 3 equal sections (red, blue, green) and a coin is flipped. What is the probability of landing on red and flipping tails?', a: ['1/6'], type: 'multi', difficulty: 2 },
    { q: 'What is a sample space?', a: 'the set of all possible outcomes of an experiment', type: 'short', difficulty: 1 },
    { q: 'You roll two dice. What is the probability that both show a 6?', a: ['1/36'], type: 'multi', difficulty: 2 },
    { q: 'A menu offers 3 entrees and 4 desserts. How many different meal combinations (one entree and one dessert) are possible?', a: '12', type: 'short', difficulty: 2 },
  ]},
  'independent-dependent-events': { questions: [
    { q: 'What are independent events?', a: 'events where the outcome of one does not affect the outcome of the other', type: 'short', difficulty: 1 },
    { q: 'What are dependent events?', a: 'events where the outcome of one event affects the probability of the other', type: 'short', difficulty: 1 },
    { q: 'True or false: Drawing a card from a deck and NOT replacing it before drawing again makes the events dependent.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A bag has 4 red and 6 blue marbles. You draw one marble and replace it. Then you draw again. Are these events independent or dependent?', a: 'independent', type: 'short', difficulty: 1 },
    { q: 'A bag has 5 red and 3 blue marbles. You draw one red marble and do NOT replace it. What is the probability the second draw is red?', a: ['4/7'], type: 'multi', difficulty: 2 },
    { q: 'Flipping a coin and then rolling a die. Are these events independent or dependent?', a: 'independent', type: 'short', difficulty: 1 },
    { q: 'A jar has 10 jelly beans (6 cherry, 4 grape). You eat one cherry jelly bean. What is the probability of picking another cherry?', a: ['5/9'], type: 'multi', difficulty: 2 },
    { q: 'Explain why drawing cards without replacement makes events dependent. Give an example.', a: 'because removing a card changes the total number of cards and the number of favorable outcomes which changes the probability for the next draw', type: 'open', difficulty: 3 },
  ]},

  // ── sampling-inference ────────────────────────────────────────────────────
  'random-sampling': { questions: [
    { q: 'What is a random sample?', a: 'a sample in which every member of the population has an equal chance of being selected', type: 'short', difficulty: 1 },
    { q: 'Why is random sampling important?', a: 'because it helps ensure the sample is representative of the whole population and reduces bias', type: 'short', difficulty: 1 },
    { q: 'True or false: Surveying only your friends about a school issue is a random sample.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A school has 800 students. A researcher randomly selects 50 students using a number generator. Is this a random sample?', a: 'yes', type: 'short', difficulty: 1 },
    { q: 'What is bias in sampling?', a: 'a systematic error that favors certain outcomes and makes the sample unrepresentative of the population', type: 'short', difficulty: 2 },
    { q: 'A teacher surveys every 5th student entering the cafeteria. What type of sampling method is this?', a: ['systematic sampling', 'systematic'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A larger random sample is generally more representative of the population than a smaller one.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A radio station asks listeners to call in and vote for their favorite song. Explain why this is not a good random sample.', a: 'because only people who listen to the station and choose to call in are included which is voluntary response bias and does not represent the whole population', type: 'open', difficulty: 3 },
  ]},
  'making-inferences': { questions: [
    { q: 'What does it mean to make an inference from data?', a: 'to draw a conclusion about a population based on information from a sample', type: 'short', difficulty: 1 },
    { q: 'A random sample of 100 students shows 65% prefer pizza for lunch. What inference can you make about the whole school?', a: 'approximately 65% of the whole school likely prefers pizza for lunch', type: 'short', difficulty: 1 },
    { q: 'True or false: Inferences from samples are always exactly correct for the population.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A sample of 200 light bulbs from a factory shows 4 defective. If the factory makes 10,000 bulbs, about how many defective bulbs would you predict?', a: '200', type: 'short', difficulty: 2 },
    { q: 'Two random samples of 50 students each show that 60% and 64% prefer basketball. Is it reasonable to conclude that about 60-64% of the school prefers basketball?', a: 'yes because multiple samples giving similar results increases confidence in the inference', type: 'short', difficulty: 2 },
    { q: 'Why should you take multiple samples before making an inference?', a: 'to see if the results are consistent which increases confidence in the conclusion', type: 'short', difficulty: 2 },
    { q: 'True or false: An inference is stronger if the sample is random and large.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A survey of 30 students at a math competition found that 90% enjoy math. Can you infer that 90% of all middle schoolers enjoy math? Explain.', a: 'no because the sample is biased since students at a math competition are more likely to enjoy math than the general population', type: 'open', difficulty: 3 },
  ]},
  'comparing-populations': { questions: [
    { q: 'What is the purpose of comparing two populations using data?', a: 'to determine if there is a meaningful difference between the two groups', type: 'short', difficulty: 1 },
    { q: 'True or false: To compare two populations, you should use the same type of data display for both.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Class A has a mean test score of 82 and class B has a mean of 78. Can you conclude class A is better at math?', a: 'not necessarily because you need to consider the spread and sample size before making that conclusion', type: 'short', difficulty: 2 },
    { q: 'The medians of two box plots are 50 and 70. The IQR of both is 10. Do the distributions overlap significantly?', a: 'no because the difference in medians (20) is much larger than the IQR (10) so the distributions are clearly separated', type: 'short', difficulty: 3 },
    { q: 'What statistic helps you decide if the difference between two groups is meaningful?', a: ['the ratio of the difference in means to the MAD or IQR', 'compare the difference in centers to the measure of variability'], type: 'multi', difficulty: 2 },
    { q: 'A school compares boys and girls on a fitness test using box plots. The boys\' median is higher but the boxes overlap a lot. What can you say?', a: 'the difference between groups is small because there is significant overlap in the data', type: 'short', difficulty: 2 },
    { q: 'True or false: If two groups have the same mean but different variability, they are identical distributions.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'Explain how you could use the MAD to determine if the difference between two group means is meaningful.', a: 'if the difference between the means is more than about 2 times the MAD the difference is likely meaningful if it is less the distributions overlap too much', type: 'open', difficulty: 3 },
  ]},
  'two-way-tables': { questions: [
    { q: 'What is a two-way table?', a: 'a table that displays data for two categorical variables at the same time', type: 'short', difficulty: 1 },
    { q: 'In a two-way table, what do the row and column totals represent?', a: ['the marginal frequencies', 'the totals for each category'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A two-way table can show the relationship between two categorical variables.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A two-way table shows: 30 boys like soccer, 20 boys like basketball, 25 girls like soccer, 35 girls like basketball. How many students total?', a: '110', type: 'short', difficulty: 1 },
    { q: 'Using the same table (30 boys-soccer, 20 boys-basketball, 25 girls-soccer, 35 girls-basketball), what fraction of girls prefer basketball?', a: ['35/60', '7/12'], type: 'multi', difficulty: 2 },
    { q: 'What is a relative frequency in a two-way table?', a: 'a frequency expressed as a fraction or percent of a total', type: 'short', difficulty: 2 },
    { q: 'In a two-way table, 45 out of 100 students are girls who ride the bus. What is the relative frequency?', a: ['45/100', '0.45', '45%'], type: 'multi', difficulty: 2 },
    { q: 'A two-way table shows pet preferences by grade. 70% of 6th graders prefer dogs and 55% of 7th graders prefer dogs. What can you infer about the association between grade and pet preference?', a: 'there may be an association because the percentages differ between grades suggesting grade level is related to pet preference', type: 'open', difficulty: 3 },
  ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// HINT BANKS — 3-tier progressive hints per skill
// ═══════════════════════════════════════════════════════════════════════════════

const HINT_BANKS = {
  // statistical-measures
  'mean': { tier1: 'The mean is the average. Add up all the values and divide.', tier2: 'Mean = sum of all values / number of values. Make sure you count every value.', tier3: 'Example: 4, 8, 6, 10, 12 → sum = 40, count = 5, mean = 40/5 = 8.' },
  'median': { tier1: 'The median is the middle number. You have to put them in order first.', tier2: 'Order the values from least to greatest. If there is an odd count, pick the middle one. If even, average the two middle values.', tier3: 'Example: 3, 7, 1, 9, 5 → ordered: 1, 3, 5, 7, 9 → median = 5 (the 3rd value).' },
  'mode': { tier1: 'The mode is the value that shows up the most. Look for repeats.', tier2: 'Count how often each value appears. The most frequent one is the mode. A data set can have no mode, one mode, or multiple modes.', tier3: 'Example: 2, 3, 3, 5, 7, 3, 8 → 3 appears 3 times (most) → mode = 3.' },
  'range': { tier1: 'Range = biggest value minus smallest value.', tier2: 'Find the maximum and minimum in the data set, then subtract: range = max − min.', tier3: 'Example: 3, 7, 1, 9, 5 → max = 9, min = 1, range = 9 − 1 = 8.' },
  'mean-absolute-deviation': { tier1: 'MAD tells you how spread out the data is from the mean. Start by finding the mean.', tier2: 'Steps: (1) Find the mean, (2) Find the distance of each value from the mean, (3) Average those distances.', tier3: 'Example: Data: 2, 4, 6, 8, 10. Mean = 6. Distances: |2-6|=4, |4-6|=2, |6-6|=0, |8-6|=2, |10-6|=4. MAD = (4+2+0+2+4)/5 = 2.4.' },

  // data-displays
  'dot-plots': { tier1: 'A dot plot uses dots above a number line. Each dot represents one data point.', tier2: 'Stack dots for repeated values. The tallest stack is the mode. Gaps show missing values.', tier3: 'Example: Data 3, 4, 4, 4, 5, 5, 7 → 1 dot over 3, 3 dots over 4, 2 dots over 5, 1 dot over 7.' },
  'histograms': { tier1: 'A histogram groups data into intervals (bins) and shows how many values fall in each bin.', tier2: 'The height of each bar shows the frequency. The bars touch because the intervals are continuous.', tier3: 'Example: Test scores in bins 60-69, 70-79, 80-89, 90-100. If 8 students scored 80-89, that bar reaches 8.' },
  'box-plots': { tier1: 'A box plot shows the five-number summary: min, Q1, median, Q3, max.', tier2: 'The box goes from Q1 to Q3 (the IQR). The line inside is the median. Whiskers extend to min and max.', tier3: 'Example: Min=10, Q1=25, Median=40, Q3=55, Max=90. The box spans 25 to 55, IQR = 30.' },
  'scatter-plots': { tier1: 'A scatter plot shows two variables as points on a grid. Look for a pattern.', tier2: 'Points going up-right = positive correlation. Points going down-right = negative. Scattered randomly = no correlation.', tier3: 'Example: Hours studied vs. test score — more hours usually means higher score → positive correlation.' },
  'line-of-best-fit': { tier1: 'A line of best fit follows the overall trend of the scatter plot points.', tier2: 'The line should have roughly equal numbers of points above and below it. Use it to make predictions.', tier3: 'Example: If the line is y = 2x + 10, then when x = 5, predicted y = 2(5) + 10 = 20.' },

  // probability-basics
  'theoretical-probability': { tier1: 'P(event) = favorable outcomes / total outcomes. Make sure outcomes are equally likely.', tier2: 'List all possible outcomes. Count the ones you want. Divide by the total.', tier3: 'Example: Rolling a 3 on a die → 1 favorable out of 6 total → P = 1/6.' },
  'experimental-probability': { tier1: 'Experimental probability = number of times event happened / total trials.', tier2: 'Unlike theoretical probability, this is based on actual results. More trials gives a better estimate.', tier3: 'Example: Flip a coin 50 times, get heads 28 times → P(heads) = 28/50 = 0.56.' },
  'compound-events': { tier1: 'A compound event involves more than one action. Think about all possible combinations.', tier2: 'For independent events: P(A and B) = P(A) × P(B). Use a tree diagram or table to list the sample space.', tier3: 'Example: P(heads AND rolling 6) = 1/2 × 1/6 = 1/12. Sample space has 2 × 6 = 12 outcomes.' },
  'independent-dependent-events': { tier1: 'Ask: Does the first event change the probability of the second? If yes → dependent. If no → independent.', tier2: 'Replacement: If you put the item back, events are independent. Without replacement → dependent (totals change).', tier3: 'Example: Draw a red marble from 5 red/3 blue, don\'t replace. P(2nd red) = 4/7 not 5/8 → dependent.' },

  // sampling-inference
  'random-sampling': { tier1: 'Every member of the population must have an equal chance of being selected.', tier2: 'Random sampling reduces bias. Methods include random number generators, drawing names from a hat, or systematic sampling.', tier3: 'Example: To survey 50 students from 800, assign each a number and use a random number generator to pick 50.' },
  'making-inferences': { tier1: 'Use your sample data to draw conclusions about the whole population.', tier2: 'A good inference requires a random, representative sample. Larger samples give more reliable inferences.', tier3: 'Example: 65 of 100 randomly chosen students prefer pizza → infer about 65% of the school prefers pizza.' },
  'comparing-populations': { tier1: 'Compare the centers (mean/median) and spreads (range/IQR/MAD) of two groups.', tier2: 'If the difference in centers is large compared to the variability, the groups are meaningfully different.', tier3: 'Example: Group A mean = 80, Group B mean = 70, both MAD ≈ 3 → difference (10) is much larger than MAD → meaningful difference.' },
  'two-way-tables': { tier1: 'A two-way table organizes data by two categories. Read rows and columns carefully.', tier2: 'Row totals and column totals are marginal frequencies. Cells inside the table are joint frequencies.', tier3: 'Example: 30 boys like soccer, 20 boys like basketball → total boys = 50. Fraction of boys who like soccer = 30/50.' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MISCONCEPTIONS — pattern-matched corrections per skill
// ═══════════════════════════════════════════════════════════════════════════════

const MISCONCEPTIONS = {
  'mean': [
    { patterns: [/mean.*same.*median|average.*same.*middle/i], correction: 'The mean and the median are NOT the same thing. The mean is the sum of all values divided by the count. The median is the middle value when data is ordered. They are only equal in perfectly symmetric distributions. Outliers affect the mean much more than the median.' },
  ],
  'median': [
    { patterns: [/median.*no.*order|don.*need.*order|just.*pick.*middle/i], correction: 'You MUST order the data from least to greatest before finding the median. If you pick the middle value from an unordered list, you will likely get the wrong answer.' },
  ],
  'mode': [
    { patterns: [/always.*has.*mode|must.*have.*mode|every.*set.*mode/i], correction: 'Not every data set has a mode. If no value repeats, there is no mode. A data set can also have more than one mode (bimodal or multimodal).' },
  ],
  'range': [
    { patterns: [/range.*uses.*all|range.*every.*value/i], correction: 'The range only uses TWO values: the maximum and minimum. It ignores everything in between. That is why it is considered a weak measure of variability — a single outlier can dramatically change it.' },
  ],
  'mean-absolute-deviation': [
    { patterns: [/mad.*negative|deviation.*negative/i], correction: 'MAD cannot be negative because we use absolute values. Each deviation is converted to a positive number before averaging. That is why it is called Mean ABSOLUTE Deviation.' },
  ],
  'histograms': [
    { patterns: [/histogram.*same.*bar graph|bar graph.*same.*histogram/i], correction: 'A histogram is NOT the same as a bar graph. A histogram shows the frequency of continuous numerical data grouped into intervals (bins), and the bars touch. A bar graph displays categorical data with gaps between bars.' },
  ],
  'box-plots': [
    { patterns: [/line.*inside.*mean|middle.*line.*mean|box.*line.*average/i], correction: 'The line inside the box of a box plot represents the MEDIAN, not the mean. The median divides the data into two equal halves. The mean is not typically shown on a box plot.' },
  ],
  'scatter-plots': [
    { patterns: [/correlation.*cause|correlated.*means.*cause|correlation.*proves/i], correction: 'Correlation does NOT mean causation. Just because two variables are correlated does not mean one causes the other. There could be a third variable (confounding variable) causing both, or the relationship could be coincidental.' },
  ],
  'line-of-best-fit': [
    { patterns: [/line.*through.*every|line.*touch.*all|line.*hit.*every/i], correction: 'A line of best fit does NOT need to pass through every data point. It should follow the overall trend with roughly equal numbers of points above and below the line. Very few (or no) actual data points may lie exactly on the line.' },
  ],
  'theoretical-probability': [
    { patterns: [/probability.*greater.*1|probability.*more.*100|probability.*over.*1/i], correction: 'Probability can NEVER be greater than 1 (or 100%). It always ranges from 0 (impossible) to 1 (certain). If you get a value greater than 1, check your calculation — you may have the fraction upside down.' },
  ],
  'experimental-probability': [
    { patterns: [/experimental.*always.*same|experimental.*equals.*theoretical|experiment.*exact/i], correction: 'Experimental probability rarely equals theoretical probability exactly. They get closer as you increase the number of trials (this is the Law of Large Numbers), but small experiments often show noticeable differences.' },
  ],
  'compound-events': [
    { patterns: [/add.*probabilities.*and|P.*and.*add|multiply.*or/i], correction: 'For compound events where both things must happen (AND), you MULTIPLY the probabilities. Adding is for "OR" situations (either event). P(A and B) = P(A) × P(B) for independent events.' },
  ],
  'independent-dependent-events': [
    { patterns: [/always.*independent|all.*events.*independent|never.*dependent/i], correction: 'Events are NOT always independent. When the outcome of one event changes the probability of another, they are dependent. A common example is drawing cards without replacement — removing one card changes what is left in the deck.' },
  ],
  'random-sampling': [
    { patterns: [/any.*sample.*random|all.*samples.*random|survey.*friends.*random/i], correction: 'Not all samples are random. A random sample requires that EVERY member of the population has an equal chance of being selected. Surveying only your friends, or only volunteers, introduces bias and is NOT random.' },
  ],
  'making-inferences': [
    { patterns: [/inference.*always.*right|sample.*always.*match|inference.*exact/i], correction: 'Inferences from samples are ESTIMATES, not exact truths. There is always some uncertainty. Using larger, random samples and taking multiple samples increases confidence but never guarantees a perfect match with the population.' },
  ],
  'two-way-tables': [
    { patterns: [/two-way.*one.*variable|two-way.*single|only.*one.*category/i], correction: 'A two-way table displays TWO categorical variables, not one. One variable defines the rows and the other defines the columns. This is what makes it "two-way" — it shows how the two variables relate to each other.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHENOMENA — driving questions for phenomenon-based learning
// ═══════════════════════════════════════════════════════════════════════════════

const PHENOMENA = {
  'statistical-measures': [
    { title: 'The Class Survey', focus: 'mean, median, mode', text: 'A teacher surveys 25 students about how many hours they sleep each night. Most students report 7-9 hours, but two students report only 3 hours and one reports 12 hours. The mean is 7.4 hours but the median is 8 hours.', drivingQuestion: 'Why are the mean and median different? Which measure of center best represents a "typical" student\'s sleep? How do the extreme values (outliers) affect each measure?' },
    { title: 'Sports Stats Showdown', focus: 'mean, range, MAD', text: 'Two basketball players both average 18 points per game this season. Player A\'s scores: 16, 17, 18, 19, 20. Player B\'s scores: 8, 12, 18, 24, 28. A coach needs to choose one for a big game.', drivingQuestion: 'Both players have the same mean. How are they different? Calculate the range and MAD for each. Which player is more consistent? Which would you choose for the big game and why?' },
  ],
  'data-displays': [
    { title: 'Weather Data Dashboard', focus: 'histograms, box plots, scatter plots', text: 'A city\'s weather service collects daily high temperatures for an entire year (365 days). They need to present the data to city planners to help plan outdoor events and energy usage.', drivingQuestion: 'Which type of graph would best show the overall distribution of temperatures? How would a box plot help compare summer vs. winter? Could a scatter plot show any relationship between month and temperature?' },
    { title: 'Student Height Growth', focus: 'scatter plots, line of best fit', text: 'A school nurse measures the heights of 6th graders at the beginning and end of the school year. She plots age vs. height for 150 students and notices a positive trend. She draws a line of best fit: y = 2.1x + 36 (height in inches, age in years).', drivingQuestion: 'What does the slope 2.1 mean in context? Can you use the equation to predict the height of a 25-year-old? Why or why not? What are the limitations of extrapolation?' },
  ],
  'probability-basics': [
    { title: 'The Game Show Door', focus: 'theoretical probability, compound events', text: 'On a game show, a contestant picks one of three doors. Behind one door is a prize. The host, who knows what is behind each door, opens a different door showing no prize. The contestant can switch or stay.', drivingQuestion: 'What is the probability of winning if you stay? What if you switch? Use a tree diagram or table to show all possible outcomes. Does switching actually improve your chances?' },
    { title: 'Lucky Socks and Free Throws', focus: 'experimental probability, independent events', text: 'A basketball player believes wearing lucky socks improves free throw shooting. Over 50 games with lucky socks, the player makes 78% of free throws. Over 50 games without, the player makes 75%.', drivingQuestion: 'Is this enough evidence that the socks help? How might you design a better experiment? What role does sample size play? Are each free throw attempt independent events?' },
  ],
  'sampling-inference': [
    { title: 'School Lunch Survey', focus: 'random sampling, making inferences', text: 'The student council wants to know if students prefer the current lunch menu or a new one. They survey 30 students from the chess club and find 80% prefer the new menu. They survey 30 randomly selected students from the whole school and find 55% prefer the new menu.', drivingQuestion: 'Why did the two surveys give different results? Which survey provides a better estimate for the whole school? How could you improve the study?' },
    { title: 'Comparing Schools\' Math Scores', focus: 'comparing populations, box plots', text: 'Two middle schools compare math test scores. School A (sample of 40): mean = 78, MAD = 6. School B (sample of 40): mean = 84, MAD = 5. The district wants to know if the difference is meaningful.', drivingQuestion: 'Is the 6-point difference between means meaningful? Compare it to the MAD values. What additional data would help? Create box plots to visualize the comparison.' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUAL LABS
// ═══════════════════════════════════════════════════════════════════════════════

const VIRTUAL_LABS = {
  'plinko-probability': {
    title: 'Virtual Plinko Probability Lab',
    skills: ['theoretical-probability', 'experimental-probability'],
    objective: 'Investigate how experimental probability approaches theoretical probability as the number of trials increases',
    background: 'A Plinko board drops a disc through rows of pegs. At each peg, the disc goes left or right with equal probability (1/2). The disc lands in one of several slots at the bottom. With more pegs and more drops, patterns emerge.',
    hypothesis_prompt: 'Predict: If you drop 10 discs, will they land evenly across all slots? What about 100 discs? 1000 discs?',
    variables: { independent: 'number of drops (10, 50, 100, 500)', dependent: 'distribution of landing positions, experimental probability per slot', controlled: ['board size (5 rows, 6 slots)', 'drop position (center)', 'peg spacing'] },
    procedure: [
      { step: 1, action: 'Drop 10 discs from the center. Record which slot each disc lands in. Calculate the experimental probability for each slot.' },
      { step: 2, action: 'Drop 50 discs. Record results and calculate experimental probabilities.' },
      { step: 3, action: 'Drop 100 discs. Record results and calculate experimental probabilities.' },
      { step: 4, action: 'Drop 500 discs. Record results and calculate experimental probabilities.' },
      { step: 5, action: 'Compare your experimental probabilities to the theoretical probabilities (based on Pascal\'s triangle: 1/32, 5/32, 10/32, 10/32, 5/32, 1/32).' },
    ],
    observations: {
      '10-drops': '10 drops: Slot results vary wildly. Example: slots got 0, 2, 3, 4, 1, 0. Very uneven. Experimental probability of center slot: 3/10 = 0.30 (theoretical ≈ 0.31).',
      '50-drops': '50 drops: Starting to see a bell shape. Slots: 1, 8, 16, 15, 7, 3. Center slots get more drops. Experimental P(center): 16/50 = 0.32.',
      '100-drops': '100 drops: Clearer bell curve. Slots: 3, 15, 32, 31, 14, 5. Experimental P(center): 32/100 = 0.32, very close to theoretical 0.3125.',
      '500-drops': '500 drops: Smooth bell curve. Slots: 16, 78, 157, 156, 77, 16. Experimental probabilities closely match theoretical. P(center): 157/500 = 0.314 ≈ 10/32.',
      'convergence': 'As trials increase: 10→0.30, 50→0.32, 100→0.32, 500→0.314. The experimental probability converges toward the theoretical value of 0.3125 (Law of Large Numbers).',
    },
    data_table: {
      columns: ['Drops', 'Slot 1', 'Slot 2', 'Slot 3', 'Slot 4', 'Slot 5', 'Slot 6', 'P(center slot)'],
      rows: [
        ['10', '0', '2', '3', '4', '1', '0', '0.30'],
        ['50', '1', '8', '16', '15', '7', '3', '0.32'],
        ['100', '3', '15', '32', '31', '14', '5', '0.32'],
        ['500', '16', '78', '157', '156', '77', '16', '0.314'],
        ['Theoretical', '1/32', '5/32', '10/32', '10/32', '5/32', '1/32', '0.3125'],
      ],
    },
    conclusion_questions: [
      'How did the distribution of drops change as you increased the number of trials?',
      'At what number of trials did your experimental probability get close to the theoretical probability?',
      'Why do the center slots get more drops than the edge slots? (Hint: think about the paths)',
      'What is the Law of Large Numbers and how does this lab demonstrate it?',
      'If you dropped 10,000 discs, what would you expect the distribution to look like?',
    ],
  },
  'mean-share-and-balance': {
    title: 'Virtual Mean as Fair Share and Balance Point Lab',
    skills: ['mean', 'mean-absolute-deviation', 'dot-plots'],
    objective: 'Visualize the mean as a "fair share" value and as the balance point of a distribution',
    background: 'The mean can be understood in two ways: (1) as the value each person would get if the total was shared equally ("fair share"), and (2) as the balance point of a dot plot (like balancing a see-saw).',
    hypothesis_prompt: 'Predict: If 5 students have 2, 4, 6, 8, and 10 cookies, and they share equally, how many does each get? Where would you place the fulcrum to balance the dot plot?',
    variables: { independent: 'data sets with different distributions', dependent: 'mean, balance point position', controlled: ['number of data points in each trial', 'scale of dot plot'] },
    procedure: [
      { step: 1, action: 'Data set: 2, 4, 6, 8, 10. Create a dot plot. Predict the balance point. Calculate the mean.' },
      { step: 2, action: 'Data set: 1, 1, 1, 1, 21. Create a dot plot. Predict the balance point. Calculate the mean.' },
      { step: 3, action: 'Data set: 5, 5, 5, 5, 5. Create a dot plot. Where is the balance point? Calculate the mean.' },
      { step: 4, action: 'For each data set, calculate the MAD. Which data set is most spread out?' },
      { step: 5, action: 'Remove the value 21 from data set 2 and recalculate the mean and MAD. How does one outlier affect both measures?' },
    ],
    observations: {
      'symmetric': 'Data: 2, 4, 6, 8, 10. Mean = 6. The dot plot is symmetric. The balance point is exactly in the center at 6. MAD = 2.4.',
      'skewed-outlier': 'Data: 1, 1, 1, 1, 21. Mean = 5. The dot plot is heavily skewed right. The balance point is at 5, which is far from most of the data (four 1s). The outlier 21 pulls the mean up. MAD = 6.4.',
      'no-variability': 'Data: 5, 5, 5, 5, 5. Mean = 5. All dots stack at 5. The balance point is trivially at 5. MAD = 0 (no spread at all).',
      'outlier-removed': 'Removing 21 from data set 2: new data = 1, 1, 1, 1. Mean = 1. MAD = 0. The outlier was responsible for inflating the mean from 1 to 5 and the MAD from 0 to 6.4.',
      'fair-share': 'Fair share for data set 1: total = 30, shared among 5 → each gets 6. This is the mean. It represents redistributing all values equally.',
    },
    data_table: {
      columns: ['Data Set', 'Values', 'Mean', 'MAD', 'Balance Point', 'Shape'],
      rows: [
        ['1', '2, 4, 6, 8, 10', '6', '2.4', '6', 'Symmetric'],
        ['2', '1, 1, 1, 1, 21', '5', '6.4', '5', 'Skewed right'],
        ['3', '5, 5, 5, 5, 5', '5', '0', '5', 'No spread'],
        ['2 (no outlier)', '1, 1, 1, 1', '1', '0', '1', 'No spread'],
      ],
    },
    conclusion_questions: [
      'How does the "fair share" interpretation of the mean relate to the formula (sum / count)?',
      'Why did the outlier in data set 2 pull the mean so far from the other values?',
      'Which measure of center (mean or median) would better describe data set 2? Why?',
      'What does a MAD of 0 tell you about a data set?',
      'Design a data set of 6 values where the mean is 10 but the median is 8.',
    ],
  },
  'sampling-simulation': {
    title: 'Virtual Random Sampling Simulation Lab',
    skills: ['random-sampling', 'making-inferences', 'comparing-populations'],
    objective: 'Investigate how sample size and sampling method affect the accuracy of inferences about a population',
    background: 'A town of 1,000 residents was surveyed about whether they support building a new park. The true population proportion is 62% in favor. We will take samples of different sizes and methods to see how closely they estimate the true value.',
    hypothesis_prompt: 'Predict: Will a sample of 10 or a sample of 100 give a closer estimate to the true 62%? Will a biased sample be close?',
    variables: { independent: 'sample size (10, 30, 50, 100), sampling method (random, biased)', dependent: 'sample proportion, accuracy of inference', controlled: ['population size (1000)', 'true proportion (62%)', 'number of samples per size (5)'] },
    procedure: [
      { step: 1, action: 'Take 5 random samples of size 10. Record the proportion in favor for each.' },
      { step: 2, action: 'Take 5 random samples of size 30. Record proportions.' },
      { step: 3, action: 'Take 5 random samples of size 100. Record proportions.' },
      { step: 4, action: 'Take a biased sample: survey 50 people at the existing park. Record proportion.' },
      { step: 5, action: 'Compare: Which sample size was most accurate? How did the biased sample compare?' },
    ],
    observations: {
      'size-10': 'Samples of 10: 50%, 70%, 60%, 80%, 40%. Range = 40%. Very inconsistent — estimates vary wildly.',
      'size-30': 'Samples of 30: 57%, 63%, 67%, 60%, 70%. Range = 13%. Better, but still some variation.',
      'size-100': 'Samples of 100: 59%, 63%, 61%, 64%, 60%. Range = 5%. Very close to the true 62% and consistent.',
      'biased-sample': 'Biased sample (at the park): 88% in favor. Way above the true 62%! People at the park already like parks.',
      'comparison': 'Larger random samples → closer to truth and less variation. Biased samples can be very misleading regardless of size.',
    },
    data_table: {
      columns: ['Method', 'Sample Size', 'Sample 1', 'Sample 2', 'Sample 3', 'Sample 4', 'Sample 5', 'Avg', 'Range'],
      rows: [
        ['Random', '10', '50%', '70%', '60%', '80%', '40%', '60%', '40%'],
        ['Random', '30', '57%', '63%', '67%', '60%', '70%', '63%', '13%'],
        ['Random', '100', '59%', '63%', '61%', '64%', '60%', '61%', '5%'],
        ['Biased', '50', '88%', '—', '—', '—', '—', '88%', '—'],
      ],
    },
    conclusion_questions: [
      'How did increasing the sample size affect the accuracy and consistency of the estimates?',
      'Why was the biased sample so far from the true proportion, even though it had 50 people?',
      'If you could only take one sample, what sample size would you recommend and why?',
      'What is the relationship between sample size and the range of sample proportions?',
      'Design a sampling plan to survey your school about a new policy. How would you ensure it is random and unbiased?',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIAGRAMS — ASCII diagrams for key concepts
// ═══════════════════════════════════════════════════════════════════════════════

const DIAGRAMS_LOCAL = {
  'dot-plot-reading': {
    domain: 'ms-math-data',
    skill: 'dot-plots',
    topic: 'Reading a Dot Plot',
    description: 'A dot plot showing quiz scores for a class.',
    diagram: `
  Number of Students' Quiz Scores

  ●
  ●           ●
  ●     ●     ●
  ●     ●     ●     ●
  ●     ●     ●     ●     ●
  +-----+-----+-----+-----+---→
  6     7     8     9    10

  [A] Mode: ___
  [B] Median: ___
  [C] How many students scored 6? ___
  [D] Total number of students: ___
`,
    labels: { A: '6', B: '8', C: '5', D: '15' },
  },
  'box-plot-reading': {
    domain: 'ms-math-data',
    skill: 'box-plots',
    topic: 'Reading a Box Plot',
    description: 'A box plot showing test scores for a class.',
    diagram: `
  Test Scores

  |----[====|====]---------|
  20   40  55  70         95

  [A] Minimum: ___
  [B] Q1: ___
  [C] Median: ___
  [D] Q3: ___
  [E] Maximum: ___
  [F] IQR: ___
`,
    labels: { A: '20', B: '40', C: '55', D: '70', E: '95', F: '30' },
  },
  'scatter-plot-correlation': {
    domain: 'ms-math-data',
    skill: 'scatter-plots',
    topic: 'Identifying Correlation in a Scatter Plot',
    description: 'Three scatter plots showing different types of correlation.',
    diagram: `
  Graph 1            Graph 2            Graph 3
  y|    . .          y|  .              y|   .    .
   |   . .            |   .  .           |  .  .
   |  . .             |    .  .          | .      .
   | . .              |     .   .        |    .  .
   |. .               |      .   .       | .   .
   +------→ x         +--------→ x      +--------→ x

  [A] Graph 1 correlation: ___________
  [B] Graph 2 correlation: ___________
  [C] Graph 3 correlation: ___________
`,
    labels: { A: 'positive', B: 'negative', C: 'no correlation' },
  },
  'histogram-shape': {
    domain: 'ms-math-data',
    skill: 'histograms',
    topic: 'Interpreting Histogram Shape',
    description: 'A histogram showing the distribution of daily temperatures.',
    diagram: `
  Daily High Temperatures (°F)

  Freq
  8  |     ████
  6  |     ████ ████
  4  | ████ ████ ████ ████
  2  | ████ ████ ████ ████ ████
  0  +-----+----+----+----+----→
     50-59 60-69 70-79 80-89 90-99

  [A] Which interval has the highest frequency? ___
  [B] How many days had temps 50-59? ___
  [C] Shape of distribution: ___
  [D] Total number of days shown: ___
`,
    labels: { A: '70-79', B: '4', C: 'approximately symmetric', D: '24' },
  },
  'two-way-table-reading': {
    domain: 'ms-math-data',
    skill: 'two-way-tables',
    topic: 'Reading a Two-Way Table',
    description: 'A two-way table showing student preferences for sports by gender.',
    diagram: `
           | Soccer | Basketball | Total
  ---------+--------+------------+------
  Boys     |   30   |     20     | [A]
  Girls    |   25   |     35     | [B]
  ---------+--------+------------+------
  Total    |  [C]   |    [D]     | [E]

  [A] Total boys: ___
  [B] Total girls: ___
  [C] Total soccer: ___
  [D] Total basketball: ___
  [E] Grand total: ___
`,
    labels: { A: '50', B: '60', C: '55', D: '55', E: '110' },
  },
  'probability-tree': {
    domain: 'ms-math-data',
    skill: 'compound-events',
    topic: 'Probability Tree Diagram',
    description: 'A tree diagram for flipping a coin and rolling a die (1-3).',
    diagram: `
                  Coin Flip
               /           \\
            H (1/2)       T (1/2)
           / | \\         / | \\
          1   2   3      1   2   3
        (1/3 each)     (1/3 each)

  [A] P(H and 1) = ___
  [B] P(T and 3) = ___
  [C] Total outcomes in sample space: ___
  [D] P(H and even number) = ___
`,
    labels: { A: '1/6', B: '1/6', C: '6', D: '1/6' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// CER PHENOMENA — Claim-Evidence-Reasoning writing prompts
// ═══════════════════════════════════════════════════════════════════════════════

const CER_PHENOMENA_LOCAL = {
  'misleading-graphs': {
    domain: 'ms-math-data',
    title: 'Misleading Graphs in the News',
    phenomenon: 'A news channel shows a bar graph comparing two political candidates\' approval ratings. Candidate A has 48% and Candidate B has 52%. But the y-axis starts at 45% instead of 0%, making it look like Candidate B has nearly double the support of Candidate A.',
    scaffold: {
      claim: 'Make a claim about whether this graph accurately represents the data.',
      evidence: 'What specific features of the graph make it misleading? What would a fair graph look like?',
      reasoning: 'Use your knowledge of data displays and scales to explain why starting the y-axis at 45% changes the visual impression.',
    },
    keyTerms: ['scale', 'y-axis', 'misleading', 'proportion', 'data display', 'bar graph'],
    rubric: {
      claim: { excellent: 'States that the graph is misleading because the truncated y-axis exaggerates a small difference', adequate: 'States the graph is misleading', developing: 'Vague or partially correct claim' },
      evidence: { excellent: 'Identifies the non-zero y-axis start, calculates the actual 4% difference, and describes what a 0-based graph would show', adequate: 'Mentions the y-axis issue', developing: 'Limited or incorrect evidence' },
      reasoning: { excellent: 'Explains that visual perception of bar height ratios creates a false impression and connects to proper graph design principles', adequate: 'Mentions that the scale matters', developing: 'Incomplete connection between evidence and claim' },
    },
  },
  'lottery-probability': {
    domain: 'ms-math-data',
    title: 'Is the Lottery a Good Investment?',
    phenomenon: 'A state lottery charges $2 per ticket. Players pick 6 numbers from 1 to 49. The jackpot is $10 million, but the probability of winning is about 1 in 14 million. Last year, a convenience store sold a winning ticket, and now everyone in the neighborhood is buying tickets at that store.',
    scaffold: {
      claim: 'Make a claim about whether buying lottery tickets at that specific store increases your chance of winning.',
      evidence: 'What does the probability tell you about the expected outcome? What is the expected value of a $2 ticket?',
      reasoning: 'Use theoretical probability and the concept of independent events to explain why the store location does not matter.',
    },
    keyTerms: ['probability', 'independent events', 'expected value', 'theoretical', 'random', 'sample space'],
    rubric: {
      claim: { excellent: 'States that the store location has no effect because each lottery draw is an independent event', adequate: 'States the store does not matter', developing: 'Vague or partially correct claim' },
      evidence: { excellent: 'Calculates expected value (about $0.71 return per $2 ticket), cites 1/14M probability, explains independence', adequate: 'Mentions the low probability', developing: 'Limited evidence' },
      reasoning: { excellent: 'Explains independent events means past results have no effect on future draws and connects to the gambler\'s fallacy', adequate: 'Mentions independence', developing: 'Incomplete reasoning' },
    },
  },
  'survey-bias': {
    domain: 'ms-math-data',
    title: 'The School Lunch Survey Debate',
    phenomenon: 'A student council president reported that 85% of students want longer lunch periods based on a survey. However, the survey was posted on social media and students voluntarily responded. Out of 600 students, only 80 responded. The principal questions the results before making any changes.',
    scaffold: {
      claim: 'Make a claim about whether the survey results accurately represent the opinions of all 600 students.',
      evidence: 'What evidence suggests the survey may be biased? Consider the sample size, sampling method, and response rate.',
      reasoning: 'Use concepts of random sampling and bias to explain why this survey design may produce unreliable results.',
    },
    keyTerms: ['random sample', 'bias', 'voluntary response', 'representative', 'population', 'inference'],
    rubric: {
      claim: { excellent: 'States that the survey likely overestimates support because voluntary response bias attracts people with strong opinions', adequate: 'States the survey may be biased', developing: 'Vague claim' },
      evidence: { excellent: 'Identifies voluntary response bias, low response rate (80/600 = 13%), and lack of random selection', adequate: 'Mentions low response rate', developing: 'Limited evidence' },
      reasoning: { excellent: 'Explains that voluntary response samples are not random and tend to overrepresent extreme opinions; connects to proper random sampling methods', adequate: 'Mentions that the sample is not random', developing: 'Incomplete reasoning' },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIOS — real-world application scenarios for lessons
// ═══════════════════════════════════════════════════════════════════════════════

const SCENARIOS = [
  { title: 'Sports Analytics', focus: 'mean, median, range, scatter plots', text: 'A baseball coach tracks batting averages for 12 players: 0.210, 0.225, 0.240, 0.255, 0.260, 0.275, 0.280, 0.290, 0.300, 0.310, 0.325, 0.405. Calculate the mean, median, and range. The coach also records at-bats vs. hits for each player in a scatter plot. Identify any outliers and discuss whether mean or median better represents the "typical" player. Draw a line of best fit and predict the hits for a player with 100 at-bats.' },
  { title: 'Weather Forecasting', focus: 'histograms, box plots, comparing populations', text: 'Compare the monthly rainfall data for two cities. City A (mm): 45, 38, 52, 60, 75, 90, 105, 98, 82, 65, 50, 42. City B (mm): 70, 68, 72, 74, 76, 78, 80, 78, 76, 74, 70, 68. Create histograms and box plots for each city. Which city has more variable rainfall? Which city would be harder to plan outdoor events in? Use the IQR to justify your answer.' },
  { title: 'School Election Polling', focus: 'random sampling, making inferences, two-way tables', text: 'Three candidates are running for school president. You take a random sample of 60 students and find: Candidate A = 24 votes, Candidate B = 20, Candidate C = 16. Create a two-way table breaking down votes by grade level (6th, 7th, 8th). Does the preferred candidate change by grade? Make an inference about the likely winner for the whole school of 480 students. How confident are you?' },
  { title: 'Carnival Game Design', focus: 'theoretical probability, experimental probability, compound events', text: 'You are designing a carnival game. Players spin a spinner (1/4 red, 1/4 blue, 1/2 green) and draw a card (1-5). If they spin red AND draw a 5, they win the grand prize. Calculate the theoretical probability of winning. Simulate 100 plays and compare experimental to theoretical. The game costs $1 and the prize costs $20. Is this game profitable for the carnival?' },
  { title: 'Health Data Analysis', focus: 'scatter plots, line of best fit, making inferences', text: 'A doctor collects data on daily exercise minutes and resting heart rate for 20 patients. The scatter plot shows a negative correlation. The line of best fit is y = -0.4x + 85. What does the slope mean in context? Predict the heart rate for someone who exercises 30 minutes per day. A patient exercises 60 minutes and has a heart rate of 90 — is this person an outlier? What might explain it?' },
  { title: 'Product Quality Control', focus: 'random sampling, mean absolute deviation, histograms', text: 'A chip factory randomly samples 50 bags each hour to check if the weight is close to the advertised 100g. Morning samples: mean = 101g, MAD = 1.5g. Afternoon samples: mean = 98g, MAD = 4.2g. Create histograms for both shifts. Which shift has better quality control? How does MAD help you decide? If the acceptable range is 95g-105g, which shift is more likely to produce bags outside the range?' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY
// ═══════════════════════════════════════════════════════════════════════════════

const VOCABULARY = {
  'statistical-measures': [
    { term: 'mean', definition: 'The average of a data set, found by adding all values and dividing by the number of values.', simplified: 'The average. Add everything up and divide by how many numbers there are.', cognate: 'media (Spanish), moyenne (French)', visual_cue: 'Think of leveling out stacked blocks so all columns are the same height.' },
    { term: 'median', definition: 'The middle value of a data set when arranged in order.', simplified: 'The middle number when you line them up from smallest to biggest.', cognate: 'mediana (Spanish), médiane (French)', visual_cue: 'Line up all the values and find the one right in the center.' },
    { term: 'mode', definition: 'The value that appears most frequently in a data set.', simplified: 'The number that shows up the most.', cognate: 'moda (Spanish), mode (French)', visual_cue: 'The most popular value — like the most popular song on the radio.' },
    { term: 'range', definition: 'The difference between the greatest and least values in a data set.', simplified: 'The biggest number minus the smallest number.', cognate: 'rango (Spanish), gamme (French)', visual_cue: 'How far apart the highest and lowest values are — like the distance between the tallest and shortest person.' },
    { term: 'mean absolute deviation', definition: 'The average distance of each data point from the mean.', simplified: 'How far the numbers are from the average, on average.', cognate: 'desviación media absoluta (Spanish)', visual_cue: 'Imagine measuring how far each person stands from the center of a room, then averaging those distances.' },
    { term: 'outlier', definition: 'A data value that is significantly different from other values in the set.', simplified: 'A number that is way bigger or smaller than the rest.', cognate: 'valor atípico (Spanish)', visual_cue: 'The one kid standing far away from the group photo.' },
  ],
  'data-displays': [
    { term: 'dot plot', definition: 'A graph that displays data using dots above a number line.', simplified: 'A picture that shows data as dots above a number line. Each dot is one piece of data.', cognate: 'diagrama de puntos (Spanish)', visual_cue: 'Stack dots like coins over each number on a number line.' },
    { term: 'histogram', definition: 'A bar graph that groups numerical data into equal intervals and shows the frequency of each interval.', simplified: 'A bar chart where each bar shows how many numbers fall into a range.', cognate: 'histograma (Spanish), histogramme (French)', visual_cue: 'Think of sorting test scores into bins (60s, 70s, 80s, 90s) and stacking bars.' },
    { term: 'box plot', definition: 'A graph that shows the five-number summary (min, Q1, median, Q3, max) of a data set.', simplified: 'A diagram with a box and lines that shows how data is spread out.', cognate: 'diagrama de caja (Spanish)', visual_cue: 'A box in the middle with two whiskers stretching out — like a cat lying on its side.' },
    { term: 'scatter plot', definition: 'A graph that uses points to show the relationship between two numerical variables.', simplified: 'A graph with dots that shows if two things are related.', cognate: 'diagrama de dispersión (Spanish)', visual_cue: 'Each dot is a person with two measurements, like height and shoe size.' },
    { term: 'line of best fit', definition: 'A straight line drawn through a scatter plot to represent the overall trend.', simplified: 'A line drawn through the dots in a scatter plot to show the pattern.', cognate: 'línea de mejor ajuste (Spanish)', visual_cue: 'A line that goes through the middle of the dots, like a path through a crowd.' },
    { term: 'correlation', definition: 'The relationship between two variables — positive, negative, or none.', simplified: 'Whether two things go up together, one goes up while the other goes down, or they have no connection.', cognate: 'correlación (Spanish), corrélation (French)', visual_cue: 'Positive = both rise together (stairs going up). Negative = one falls as the other rises (seesaw).' },
  ],
  'probability-basics': [
    { term: 'probability', definition: 'A number from 0 to 1 that represents how likely an event is to occur.', simplified: 'How likely something is to happen, measured from 0 (impossible) to 1 (certain).', cognate: 'probabilidad (Spanish), probabilité (French)', visual_cue: 'A scale from "no way" (0) to "definitely" (1), with "maybe" (0.5) in the middle.' },
    { term: 'theoretical probability', definition: 'Probability based on reasoning about equally likely outcomes.', simplified: 'The chance of something happening based on math and logic, not experiments.', cognate: 'probabilidad teórica (Spanish)', visual_cue: 'A fair die has 6 sides, so each side has a 1/6 chance — you know this without rolling.' },
    { term: 'experimental probability', definition: 'Probability based on the results of an actual experiment.', simplified: 'The chance of something based on what actually happened when you tried it.', cognate: 'probabilidad experimental (Spanish)', visual_cue: 'Flip a coin 100 times and count the heads — that fraction is the experimental probability.' },
    { term: 'sample space', definition: 'The set of all possible outcomes of an experiment.', simplified: 'Every possible thing that could happen.', cognate: 'espacio muestral (Spanish)', visual_cue: 'All the branches of a tree diagram, or all squares in a grid of outcomes.' },
    { term: 'compound event', definition: 'An event consisting of two or more simple events.', simplified: 'When two or more things happen together, like flipping a coin AND rolling a die.', cognate: 'evento compuesto (Spanish)', visual_cue: 'Two actions chained together — like a two-step recipe.' },
    { term: 'independent events', definition: 'Events where the outcome of one does not affect the probability of the other.', simplified: 'When one thing happening does not change the chance of the other thing happening.', cognate: 'eventos independientes (Spanish)', visual_cue: 'Flipping a coin twice — the first flip does not change what the second flip will be.' },
  ],
  'sampling-inference': [
    { term: 'population', definition: 'The entire group you want to study or make conclusions about.', simplified: 'The whole group you are interested in learning about.', cognate: 'población (Spanish), population (French)', visual_cue: 'All the students in a school, all the fish in a lake.' },
    { term: 'sample', definition: 'A smaller group selected from a population to represent it.', simplified: 'A small piece of the big group that you actually study.', cognate: 'muestra (Spanish), échantillon (French)', visual_cue: 'Tasting a spoonful of soup to know how the whole pot tastes.' },
    { term: 'random sample', definition: 'A sample where every member of the population has an equal chance of being selected.', simplified: 'Picking people fairly so everyone has the same chance of being chosen.', cognate: 'muestra aleatoria (Spanish)', visual_cue: 'Drawing names from a hat where every name is in the hat.' },
    { term: 'bias', definition: 'A systematic error in sampling that makes the sample unrepresentative.', simplified: 'When a sample is unfair and does not represent everyone equally.', cognate: 'sesgo (Spanish), biais (French)', visual_cue: 'Asking only basketball players if they like sports — of course they will say yes!' },
    { term: 'inference', definition: 'A conclusion about a population drawn from sample data.', simplified: 'A smart guess about the whole group based on what you learned from a small part.', cognate: 'inferencia (Spanish), inférence (French)', visual_cue: 'Like predicting a movie is good because the trailer (sample) was great.' },
    { term: 'two-way table', definition: 'A table showing data for two categorical variables organized in rows and columns.', simplified: 'A table with rows and columns that shows two types of information at the same time.', cognate: 'tabla de doble entrada (Spanish)', visual_cue: 'A grid where rows are one category (like gender) and columns are another (like favorite sport).' },
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

class MSMathData extends DomainSkillBase {
  constructor() {
    super('ms-math-data', 'ms-math-data', DATA_DIR, loadProfile, saveProfile, HINT_BANKS);
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
        if (m < MASTERY_THRESHOLD && _dataTopicUnlocked(sk, p.skills)) {
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
        const isUnlocked = _dataTopicUnlocked(sk, p.skills);
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
    if (!target) return { message: 'All data & probability skills are proficient!', congratulations: true };
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
        apply: scenario ? `Analyze scenario: "${scenario.title}"` : 'Connect to real-world data & probability applications',
        extend: `Connect ${target.skill} to related data & probability concepts`,
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
    if (!name) return { labs: Object.keys(VIRTUAL_LABS), instructions: 'node data.js lab <id> <lab-name> [obs-key]' };
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
      return { categories: Object.keys(VOCABULARY), instructions: 'Specify a category to see its vocabulary.' };
    }
    const vocab = VOCABULARY[category];
    if (!vocab) return { error: `Unknown category: ${category}. Available: ${Object.keys(VOCABULARY).join(', ')}` };
    return { category, terms: vocab };
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
      message: due.length === 0 ? 'No data & probability skills due for review today!' : `${due.length} skill(s) need review. Work through each exercise below.`,
    };
  }
}

module.exports = MSMathData;

// ═══════════════════════════════════════════════════════════════════════════════
// CLI: node data.js <command> [args]
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  const api = new MSMathData();
  const common = buildCommonCLIHandlers(api, DATA_DIR, 'ms-math-data', loadProfile, saveProfile);
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
        try { ans = JSON.parse(answersJson); } catch { throw new Error("answers-json must be valid JSON e.g. '{\"A\":\"positive\"}'"); }
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
        const [, id, category] = args;
        if (!id) throw new Error('Usage: vocab <id> [category]');
        out(api.getVocabulary(category || null));
        break;
      }
      case 'help': out({
        skill: 'ms-math-data',
        gradeLevel: '6-8',
        standards: 'CCSS 6.SP, 7.SP, 8.SP',
        usage: 'node data.js <command> [args]',
        commands: {
          'start <id>': 'Start a student session; includes last session state for resume prompt',
          'resume <id>': 'Resume last session or offer to start fresh if >24h old',
          'lesson <id>': 'Generate a lesson with concept explanation and exercises',
          'exercise <id> [skill]': 'Generate 5 practice items; optionally filter by skill',
          'check <id> <type> <expected> <answer> [skill]': 'Check an answer; returns misconception feedback if wrong',
          'record <id> <skill> <score> <total> [hints] [notes]': 'Save a scored assessment attempt',
          'progress <id>': 'Show mastery levels across all data & probability skills',
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
          'vocab <id> [category]': 'Pre-teach data & probability vocabulary',
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
        usage: 'node data.js <command> [args]',
        commands: ['start', 'resume', 'lesson', 'exercise', 'check', 'record', 'progress', 'report', 'next', 'catalog', 'students', 'review', 'hint', 'hint-reset', 'lab', 'diagram', 'diagram-check', 'cer', 'cer-check', 'cer-history', 'vocab', 'phenomenon', 'scenario', 'profile', 'standards', 'socratic', 'socratic-record', 'suggest-next', 'progression', 'help'],
      });
    }
  });
}
