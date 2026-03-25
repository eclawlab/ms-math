// eClaw MS Math Geometry & Measurement Tutor (6-8).
// CCSS Geometry & Measurement aligned.

const { dataDir, loadProfile: _lp, saveProfile: _sp, listProfiles, calcMastery, masteryLabel, shuffle, pick, runCLI, srGrade, srUpdate, srEffectiveMastery, srDueToday, MASTERY_THRESHOLD, saveSessionState, loadSessionState, fsrsUpdateStability, fsrsUpdateDifficulty, fsrsNextReview, today } = require('../_lib/core');
const { buildDiffContext } = require('../_lib/differentiation');
const { DomainSkillBase, buildCommonCLIHandlers, generateExercise: _generateExercise, checkAnswer: _checkAnswer } = require('../_lib/exercise-factory');

const DATA_DIR = dataDir('ms-math-geometry');
const loadProfile = id => _lp(DATA_DIR, id);
const saveProfile = p => _sp(DATA_DIR, p);

const SKILLS = {
  'angles-lines': ['angle-types', 'complementary-supplementary', 'vertical-angles', 'parallel-lines-transversals', 'angle-relationships'],
  'triangles': ['triangle-types', 'triangle-angle-sum', 'pythagorean-theorem', 'pythagorean-applications', 'triangle-inequality'],
  'polygons-circles': ['polygon-properties', 'area-parallelograms', 'area-triangles', 'area-circles', 'circumference', 'composite-shapes'],
  'volume-surface-area': ['volume-prisms', 'volume-cylinders', 'volume-cones-spheres', 'surface-area'],
  'transformations': ['translations', 'reflections', 'rotations', 'dilations', 'congruence-similarity'],
};

// Prerequisites: topic -> [topics that must be mastered first].
const TOPIC_PREREQUISITES = {
  // angles-lines (foundational)
  'angle-types': [],
  'complementary-supplementary': ['angle-types'],
  'vertical-angles': ['angle-types'],
  'parallel-lines-transversals': ['angle-types', 'vertical-angles'],
  'angle-relationships': ['complementary-supplementary', 'vertical-angles', 'parallel-lines-transversals'],
  // triangles
  'triangle-types': ['angle-types'],
  'triangle-angle-sum': ['triangle-types', 'complementary-supplementary'],
  'pythagorean-theorem': ['triangle-angle-sum'],
  'pythagorean-applications': ['pythagorean-theorem'],
  'triangle-inequality': ['triangle-types'],
  // polygons-circles
  'polygon-properties': ['angle-relationships', 'triangle-angle-sum'],
  'area-parallelograms': ['polygon-properties'],
  'area-triangles': ['area-parallelograms', 'triangle-types'],
  'area-circles': ['circumference'],
  'circumference': ['polygon-properties'],
  'composite-shapes': ['area-triangles', 'area-circles'],
  // volume-surface-area
  'volume-prisms': ['area-parallelograms', 'area-triangles'],
  'volume-cylinders': ['area-circles', 'volume-prisms'],
  'volume-cones-spheres': ['volume-cylinders'],
  'surface-area': ['area-parallelograms', 'area-triangles', 'area-circles'],
  // transformations
  'translations': ['polygon-properties'],
  'reflections': ['translations'],
  'rotations': ['reflections'],
  'dilations': ['rotations'],
  'congruence-similarity': ['dilations'],
};

// Helper: is a topic unlocked (all prereqs mastered)?
function _geometryTopicUnlocked(topic, profileSkills) {
  return (TOPIC_PREREQUISITES[topic] || []).every(r => (profileSkills[r]?.mastery || 0) >= MASTERY_THRESHOLD);
}

// ===============================================================================
// QUESTION BANKS -- 8 questions per skill, CCSS Geometry aligned
// ===============================================================================

const QUESTION_BANKS = {
  // -- angles-lines ---------------------------------------------------------------
  'angle-types': { questions: [
    { q: 'What type of angle measures exactly 90 degrees?', a: 'right angle', type: 'short', difficulty: 1 },
    { q: 'What type of angle measures less than 90 degrees?', a: 'acute angle', type: 'short', difficulty: 1 },
    { q: 'What type of angle measures more than 90 degrees but less than 180 degrees?', a: 'obtuse angle', type: 'short', difficulty: 1 },
    { q: 'What type of angle measures exactly 180 degrees?', a: ['straight angle', 'straight'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A reflex angle measures between 180 and 360 degrees.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Classify an angle that measures 137 degrees.', a: 'obtuse', type: 'short', difficulty: 1 },
    { q: 'Classify an angle that measures 42 degrees.', a: 'acute', type: 'short', difficulty: 1 },
    { q: 'An angle measures 210 degrees. What type of angle is it?', a: ['reflex', 'reflex angle'], type: 'multi', difficulty: 2 },
  ]},
  'complementary-supplementary': { questions: [
    { q: 'What are complementary angles?', a: 'two angles whose measures add up to 90 degrees', type: 'short', difficulty: 1 },
    { q: 'What are supplementary angles?', a: 'two angles whose measures add up to 180 degrees', type: 'short', difficulty: 1 },
    { q: 'An angle measures 35 degrees. What is the measure of its complement?', a: ['55 degrees', '55'], type: 'multi', difficulty: 1 },
    { q: 'An angle measures 110 degrees. What is the measure of its supplement?', a: ['70 degrees', '70'], type: 'multi', difficulty: 1 },
    { q: 'True or false: Two obtuse angles can be supplementary.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'Two complementary angles are in the ratio 2:3. What are their measures?', a: ['36 and 54 degrees', '36 degrees and 54 degrees', '36 and 54'], type: 'multi', difficulty: 2 },
    { q: 'Can two acute angles be supplementary? Explain.', a: 'no because the maximum sum of two acute angles is less than 180 degrees', type: 'open', difficulty: 2 },
    { q: 'An angle is 15 degrees more than its complement. What is the angle?', a: ['52.5 degrees', '52.5'], type: 'multi', difficulty: 3 },
  ]},
  'vertical-angles': { questions: [
    { q: 'What are vertical angles?', a: 'pairs of opposite angles formed when two lines intersect', type: 'short', difficulty: 1 },
    { q: 'True or false: Vertical angles are always congruent.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'Two lines intersect. One angle measures 65 degrees. What is the measure of the vertical angle?', a: ['65 degrees', '65'], type: 'multi', difficulty: 1 },
    { q: 'Two lines intersect forming an angle of 65 degrees. What are the measures of all four angles?', a: ['65, 115, 65, 115', '65 degrees and 115 degrees'], type: 'multi', difficulty: 2 },
    { q: 'Two vertical angles are represented by (3x + 10) and (5x - 20). What is x?', a: ['15', 'x = 15'], type: 'multi', difficulty: 2 },
    { q: 'Why are vertical angles always equal? Explain using supplementary angles.', a: 'each vertical angle is supplementary to the same adjacent angle so they must be equal', type: 'open', difficulty: 3 },
    { q: 'True or false: Vertical angles are also adjacent angles.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Two lines intersect. If one angle is 90 degrees, what are all four angles?', a: ['all four angles are 90 degrees', '90 90 90 90', '90, 90, 90, 90'], type: 'multi', difficulty: 2 },
  ]},
  'parallel-lines-transversals': { questions: [
    { q: 'What is a transversal?', a: 'a line that crosses two or more other lines', type: 'short', difficulty: 1 },
    { q: 'When a transversal crosses parallel lines, what are corresponding angles?', a: 'angles in the same position at each intersection that are congruent', type: 'short', difficulty: 1 },
    { q: 'True or false: Alternate interior angles formed by a transversal crossing parallel lines are congruent.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A transversal crosses two parallel lines. One angle measures 72 degrees. What is the measure of its alternate interior angle?', a: ['72 degrees', '72'], type: 'multi', difficulty: 1 },
    { q: 'What is the relationship between co-interior (same-side interior) angles when a transversal crosses parallel lines?', a: ['they are supplementary', 'they add up to 180 degrees'], type: 'multi', difficulty: 2 },
    { q: 'A transversal crosses two parallel lines. One co-interior angle is 65 degrees. What is the other co-interior angle?', a: ['115 degrees', '115'], type: 'multi', difficulty: 2 },
    { q: 'If a transversal is perpendicular to one of two parallel lines, what is its relationship to the other parallel line?', a: 'it is also perpendicular to the other parallel line', type: 'short', difficulty: 2 },
    { q: 'Two parallel lines are cut by a transversal. Angle 1 = (4x + 5) degrees and its corresponding angle = (6x - 25) degrees. Find x.', a: ['15', 'x = 15'], type: 'multi', difficulty: 3 },
  ]},
  'angle-relationships': { questions: [
    { q: 'What are adjacent angles?', a: 'two angles that share a common vertex and a common side but do not overlap', type: 'short', difficulty: 1 },
    { q: 'What is a linear pair of angles?', a: ['two adjacent angles that form a straight line and are supplementary', 'adjacent supplementary angles'], type: 'multi', difficulty: 1 },
    { q: 'True or false: All adjacent angles are supplementary.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Angles A and B form a linear pair. Angle A measures 132 degrees. What is angle B?', a: ['48 degrees', '48'], type: 'multi', difficulty: 1 },
    { q: 'Three angles meet at a point on a straight line: 40 degrees, x degrees, and 75 degrees. Find x.', a: ['65 degrees', '65'], type: 'multi', difficulty: 2 },
    { q: 'Angles around a point sum to how many degrees?', a: ['360 degrees', '360'], type: 'multi', difficulty: 1 },
    { q: 'Four angles meet at a point: 90, 85, 110, and x degrees. Find x.', a: ['75 degrees', '75'], type: 'multi', difficulty: 2 },
    { q: 'Explain the difference between vertical angles and a linear pair.', a: 'vertical angles are opposite and congruent while a linear pair are adjacent and supplementary', type: 'open', difficulty: 2 },
  ]},

  // -- triangles -------------------------------------------------------------------
  'triangle-types': { questions: [
    { q: 'What is an equilateral triangle?', a: 'a triangle with all three sides equal and all three angles equal to 60 degrees', type: 'short', difficulty: 1 },
    { q: 'What is an isosceles triangle?', a: 'a triangle with at least two equal sides', type: 'short', difficulty: 1 },
    { q: 'What is a scalene triangle?', a: 'a triangle with no equal sides', type: 'short', difficulty: 1 },
    { q: 'Classify a triangle with angles 60, 60, and 60 degrees by its angles and sides.', a: ['equilateral and equiangular', 'equilateral', 'acute equilateral'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A right triangle can also be isosceles.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Classify a triangle with sides 5 cm, 5 cm, and 8 cm.', a: 'isosceles', type: 'short', difficulty: 1 },
    { q: 'A triangle has angles 30, 60, and 90 degrees. Classify it by its angles.', a: 'right triangle', type: 'short', difficulty: 1 },
    { q: 'Can a triangle be both obtuse and equilateral? Explain.', a: 'no because an equilateral triangle has all angles equal to 60 degrees which are all acute', type: 'open', difficulty: 2 },
  ]},
  'triangle-angle-sum': { questions: [
    { q: 'What is the sum of all interior angles in a triangle?', a: ['180 degrees', '180'], type: 'multi', difficulty: 1 },
    { q: 'A triangle has angles of 50 and 70 degrees. What is the third angle?', a: ['60 degrees', '60'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A triangle can have two right angles.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A triangle has angles of 45 and 90 degrees. What is the third angle?', a: ['45 degrees', '45'], type: 'multi', difficulty: 1 },
    { q: 'The angles of a triangle are x, 2x, and 3x. Find x.', a: ['30 degrees', '30'], type: 'multi', difficulty: 2 },
    { q: 'An exterior angle of a triangle measures 120 degrees. The two non-adjacent interior angles are equal. What is each?', a: ['60 degrees', '60'], type: 'multi', difficulty: 2 },
    { q: 'What is the relationship between an exterior angle of a triangle and the two non-adjacent interior angles?', a: 'the exterior angle equals the sum of the two non-adjacent interior angles', type: 'short', difficulty: 2 },
    { q: 'Can a triangle have angles of 60, 70, and 60 degrees? Explain.', a: 'no because 60 + 70 + 60 = 190 which is more than 180 degrees', type: 'open', difficulty: 2 },
  ]},
  'pythagorean-theorem': { questions: [
    { q: 'State the Pythagorean theorem.', a: ['a^2 + b^2 = c^2', 'the sum of the squares of the two legs equals the square of the hypotenuse'], type: 'multi', difficulty: 1 },
    { q: 'A right triangle has legs of 3 and 4. What is the hypotenuse?', a: '5', type: 'short', difficulty: 1 },
    { q: 'A right triangle has legs of 6 and 8. What is the hypotenuse?', a: '10', type: 'short', difficulty: 1 },
    { q: 'True or false: The Pythagorean theorem works for all triangles.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A right triangle has a hypotenuse of 13 and one leg of 5. What is the other leg?', a: '12', type: 'short', difficulty: 2 },
    { q: 'A right triangle has legs of 5 and 12. What is the hypotenuse?', a: '13', type: 'short', difficulty: 2 },
    { q: 'What is the hypotenuse of a right triangle with legs of 1 and 1?', a: ['sqrt(2)', 'square root of 2', 'about 1.41', '1.41'], type: 'multi', difficulty: 2 },
    { q: 'A right triangle has a hypotenuse of 10 and one leg of 6. Find the other leg.', a: '8', type: 'short', difficulty: 2 },
  ]},
  'pythagorean-applications': { questions: [
    { q: 'A ladder leans against a wall. The base is 6 feet from the wall and the ladder is 10 feet long. How high up the wall does the ladder reach?', a: '8 feet', type: 'short', difficulty: 2 },
    { q: 'A rectangular field is 40 m long and 30 m wide. What is the length of the diagonal?', a: '50 m', type: 'short', difficulty: 2 },
    { q: 'Two friends start at the same point. One walks 9 km north and the other walks 12 km east. How far apart are they?', a: '15 km', type: 'short', difficulty: 2 },
    { q: 'A TV screen has a diagonal of 50 inches and a width of 40 inches. What is its height?', a: '30 inches', type: 'short', difficulty: 2 },
    { q: 'True or false: If a triangle has sides 7, 24, and 25, it is a right triangle.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A baseball diamond is a square with 90-foot sides. What is the distance from home plate to second base?', a: ['about 127.3 feet', '127.3 feet', '90*sqrt(2)', 'about 127 feet'], type: 'multi', difficulty: 3 },
    { q: 'Does a triangle with sides 5, 12, and 14 form a right triangle? Explain.', a: 'no because 5^2 + 12^2 = 169 but 14^2 = 196 and they are not equal', type: 'open', difficulty: 3 },
    { q: 'A ship sails 8 km east then 15 km north. What is the shortest distance back to the starting point?', a: '17 km', type: 'short', difficulty: 2 },
  ]},
  'triangle-inequality': { questions: [
    { q: 'State the triangle inequality theorem.', a: 'the sum of any two sides of a triangle must be greater than the third side', type: 'short', difficulty: 1 },
    { q: 'Can a triangle have sides of 3, 4, and 8? Explain.', a: 'no because 3 + 4 = 7 which is less than 8', type: 'open', difficulty: 1 },
    { q: 'Can a triangle have sides of 5, 7, and 10? Explain.', a: 'yes because 5 + 7 = 12 which is greater than 10', type: 'open', difficulty: 1 },
    { q: 'True or false: A triangle can have sides of 1, 2, and 3.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'Two sides of a triangle are 6 and 10. What is the range of possible lengths for the third side?', a: ['greater than 4 and less than 16', '4 < x < 16', 'between 4 and 16'], type: 'multi', difficulty: 2 },
    { q: 'Can a triangle have sides of 5, 5, and 10?', a: 'no because 5 + 5 = 10 which is not greater than 10', type: 'open', difficulty: 2 },
    { q: 'Two sides of a triangle are 8 and 15. What is the smallest whole number length the third side can be?', a: '8', type: 'short', difficulty: 2 },
    { q: 'A triangle has sides of 7, 10, and x. If x must be a whole number, list all possible values of x.', a: 'x can be 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, or 16', type: 'open', difficulty: 3 },
  ]},

  // -- polygons-circles ------------------------------------------------------------
  'polygon-properties': { questions: [
    { q: 'What is a polygon?', a: 'a closed two-dimensional shape with straight sides', type: 'short', difficulty: 1 },
    { q: 'How many sides does a hexagon have?', a: ['6', 'six'], type: 'multi', difficulty: 1 },
    { q: 'What is a regular polygon?', a: 'a polygon with all sides equal and all angles equal', type: 'short', difficulty: 1 },
    { q: 'What is the sum of interior angles of a quadrilateral?', a: ['360 degrees', '360'], type: 'multi', difficulty: 1 },
    { q: 'What formula gives the sum of interior angles of an n-sided polygon?', a: ['(n-2) x 180', '(n - 2) times 180 degrees', '180(n-2)'], type: 'multi', difficulty: 2 },
    { q: 'What is the sum of interior angles of a pentagon?', a: ['540 degrees', '540'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A rectangle is a parallelogram.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'What is the measure of each interior angle of a regular octagon?', a: ['135 degrees', '135'], type: 'multi', difficulty: 2 },
  ]},
  'area-parallelograms': { questions: [
    { q: 'What is the formula for the area of a parallelogram?', a: ['A = base x height', 'A = bh', 'base times height'], type: 'multi', difficulty: 1 },
    { q: 'A parallelogram has a base of 8 cm and a height of 5 cm. What is its area?', a: ['40 cm^2', '40 square cm', '40'], type: 'multi', difficulty: 1 },
    { q: 'True or false: The height of a parallelogram is always the same as the length of one of its sides.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A rectangle is 12 m long and 7 m wide. What is its area?', a: ['84 m^2', '84 square meters', '84'], type: 'multi', difficulty: 1 },
    { q: 'A parallelogram has an area of 60 cm^2 and a base of 10 cm. What is its height?', a: ['6 cm', '6'], type: 'multi', difficulty: 2 },
    { q: 'Why is the area formula for a parallelogram the same as base times height, not base times side?', a: 'because the height is the perpendicular distance between the base and the opposite side not the slanted side', type: 'open', difficulty: 2 },
    { q: 'A parallelogram has a base of 15 cm and a side of 10 cm. The height corresponding to the base is 8 cm. What is the area?', a: ['120 cm^2', '120'], type: 'multi', difficulty: 2 },
    { q: 'A square has a perimeter of 24 cm. What is its area?', a: ['36 cm^2', '36'], type: 'multi', difficulty: 2 },
  ]},
  'area-triangles': { questions: [
    { q: 'What is the formula for the area of a triangle?', a: ['A = 1/2 x base x height', 'A = (1/2)bh', 'half base times height'], type: 'multi', difficulty: 1 },
    { q: 'A triangle has a base of 10 cm and a height of 6 cm. What is its area?', a: ['30 cm^2', '30 square cm', '30'], type: 'multi', difficulty: 1 },
    { q: 'True or false: The height of a triangle is always inside the triangle.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A triangle has an area of 24 m^2 and a base of 8 m. What is its height?', a: ['6 m', '6'], type: 'multi', difficulty: 2 },
    { q: 'Why is the area of a triangle half the area of a parallelogram with the same base and height?', a: 'because a triangle is exactly half of a parallelogram formed by combining two identical triangles', type: 'open', difficulty: 2 },
    { q: 'A right triangle has legs of 9 cm and 12 cm. What is its area?', a: ['54 cm^2', '54'], type: 'multi', difficulty: 1 },
    { q: 'An isosceles triangle has a base of 10 cm and equal sides of 13 cm. What is its area? (Hint: find the height first.)', a: ['60 cm^2', '60'], type: 'multi', difficulty: 3 },
    { q: 'A triangle has vertices at (0,0), (6,0), and (3,4) on a coordinate plane. What is its area?', a: ['12 square units', '12'], type: 'multi', difficulty: 3 },
  ]},
  'area-circles': { questions: [
    { q: 'What is the formula for the area of a circle?', a: ['A = pi*r^2', 'A = pi r squared', 'pi times radius squared'], type: 'multi', difficulty: 1 },
    { q: 'What is the area of a circle with radius 5?', a: ['25pi', '25pi or about 78.5 square units', '78.5', 'about 78.5 square units'], type: 'multi', difficulty: 1 },
    { q: 'What is the area of a circle with radius 10?', a: ['100pi', 'about 314 square units', '314.16', '100pi or about 314.2 square units'], type: 'multi', difficulty: 1 },
    { q: 'True or false: If you double the radius of a circle, the area doubles.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'If you double the radius of a circle, how does the area change?', a: ['it quadruples', 'the area is multiplied by 4', 'it becomes 4 times as large'], type: 'multi', difficulty: 2 },
    { q: 'A circle has a diameter of 14 cm. What is its area? (Use pi = 3.14)', a: ['153.86 cm^2', '153.86', 'about 153.9 cm^2', '49pi'], type: 'multi', difficulty: 2 },
    { q: 'A circle has an area of 36pi square centimeters. What is its radius?', a: ['6 cm', '6'], type: 'multi', difficulty: 2 },
    { q: 'A circular garden has a radius of 7 meters. How much fencing is needed to enclose it and how much soil covers it? (Use pi = 3.14)', a: 'circumference is about 43.96 m for fencing and area is about 153.86 m^2 for soil', type: 'open', difficulty: 3 },
  ]},
  'circumference': { questions: [
    { q: 'What is the formula for the circumference of a circle?', a: ['C = 2*pi*r', 'C = pi*d', 'circumference equals 2 pi r or pi d'], type: 'multi', difficulty: 1 },
    { q: 'What is the circumference of a circle with radius 7? (Use pi = 3.14)', a: ['43.96', 'about 43.96', '14pi', 'about 44'], type: 'multi', difficulty: 1 },
    { q: 'What is pi approximately equal to?', a: ['3.14', '3.14159', '22/7'], type: 'multi', difficulty: 1 },
    { q: 'True or false: The ratio of circumference to diameter is the same for every circle.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A circle has a diameter of 20 cm. What is its circumference? (Use pi = 3.14)', a: ['62.8 cm', '62.8', '20pi'], type: 'multi', difficulty: 1 },
    { q: 'A circular track has a circumference of 400 meters. What is its radius? (Use pi = 3.14)', a: ['about 63.7 meters', '63.7', '200/pi'], type: 'multi', difficulty: 2 },
    { q: 'A wheel has a radius of 0.5 m. How far does it travel in one full rotation?', a: ['about 3.14 m', 'pi meters', '3.14 m'], type: 'multi', difficulty: 2 },
    { q: 'If the circumference of a circle is 31.4 cm, what is the diameter?', a: ['10 cm', '10'], type: 'multi', difficulty: 2 },
  ]},
  'composite-shapes': { questions: [
    { q: 'How do you find the area of a composite shape?', a: 'break it into simpler shapes, find the area of each, then add or subtract them', type: 'short', difficulty: 1 },
    { q: 'An L-shaped figure can be split into two rectangles: 4x3 and 6x2. What is the total area?', a: ['24 square units', '24'], type: 'multi', difficulty: 1 },
    { q: 'A rectangular garden (10 m x 8 m) has a circular pond (radius 2 m) in the middle. What is the area of just the garden (not the pond)?', a: ['about 67.4 m^2', '80 - 4pi', 'about 67.44 m^2'], type: 'multi', difficulty: 2 },
    { q: 'True or false: To find the area of a shape with a hole, you subtract the area of the hole.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A semicircle has a diameter of 10 cm. What is its area?', a: ['about 39.27 cm^2', '12.5pi', 'about 39.3 cm^2'], type: 'multi', difficulty: 2 },
    { q: 'A shape consists of a square with side 6 cm and a semicircle on one side. What is the total area? (Use pi = 3.14)', a: ['about 50.13 cm^2', '36 + 4.5pi', 'about 50.1 cm^2'], type: 'multi', difficulty: 2 },
    { q: 'A running track consists of a rectangle (100 m x 60 m) with semicircles on each short end. What is the total area of the track?', a: ['about 8827 m^2', '6000 + 900pi', 'about 8826.99 m^2'], type: 'multi', difficulty: 3 },
    { q: 'Explain a strategy for finding the area of an irregular shape on a grid.', a: 'you can count whole squares, estimate partial squares, or enclose it in a rectangle and subtract the areas outside the shape', type: 'open', difficulty: 2 },
  ]},

  // -- volume-surface-area ---------------------------------------------------------
  'volume-prisms': { questions: [
    { q: 'What is the formula for the volume of a rectangular prism?', a: ['V = length x width x height', 'V = lwh', 'length times width times height'], type: 'multi', difficulty: 1 },
    { q: 'A rectangular prism has dimensions 4 cm, 5 cm, and 6 cm. What is its volume?', a: ['120 cm^3', '120 cubic cm', '120'], type: 'multi', difficulty: 1 },
    { q: 'What is the general formula for the volume of any prism?', a: ['V = base area x height', 'V = Bh', 'base area times height'], type: 'multi', difficulty: 1 },
    { q: 'True or false: Doubling all dimensions of a rectangular prism doubles its volume.', a: 'false', type: 'tf', difficulty: 2 },
    { q: 'A triangular prism has a triangular base with base 6 cm and height 4 cm, and the prism height is 10 cm. What is its volume?', a: ['120 cm^3', '120'], type: 'multi', difficulty: 2 },
    { q: 'If you double all three dimensions of a rectangular prism, by what factor does the volume increase?', a: ['8', 'it increases by a factor of 8'], type: 'multi', difficulty: 2 },
    { q: 'A cube has a volume of 64 cm^3. What is the length of each edge?', a: ['4 cm', '4'], type: 'multi', difficulty: 2 },
    { q: 'A fish tank is 60 cm long, 30 cm wide, and 40 cm tall. How many liters of water can it hold? (1 liter = 1000 cm^3)', a: ['72 liters', '72'], type: 'multi', difficulty: 2 },
  ]},
  'volume-cylinders': { questions: [
    { q: 'What is the formula for the volume of a cylinder?', a: ['V = pi*r^2*h', 'V = pi r squared times h', 'pi times radius squared times height'], type: 'multi', difficulty: 1 },
    { q: 'What is the volume of a cylinder with radius 3 and height 10?', a: ['90pi', '90pi or about 282.7 cubic units', 'about 282.7', '282.74'], type: 'multi', difficulty: 1 },
    { q: 'A cylinder has a radius of 5 cm and a height of 12 cm. What is its volume? (Use pi = 3.14)', a: ['942 cm^3', '942', '300pi', 'about 942 cm^3'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A cylinder is a prism with a circular base.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A cylinder has a volume of 200pi cm^3 and a radius of 5 cm. What is its height?', a: ['8 cm', '8'], type: 'multi', difficulty: 2 },
    { q: 'A cylindrical water tank has a diameter of 4 m and a height of 3 m. What is its volume?', a: ['about 37.7 m^3', '12pi', '37.68', '37.7'], type: 'multi', difficulty: 2 },
    { q: 'If you double the radius of a cylinder but keep the height the same, how does the volume change?', a: ['it quadruples', 'the volume is multiplied by 4', 'it becomes 4 times as large'], type: 'multi', difficulty: 2 },
    { q: 'A can of soup has a radius of 3.5 cm and a height of 10 cm. What is its volume? (Use pi = 3.14)', a: ['about 384.65 cm^3', '384.65', 'about 385 cm^3'], type: 'multi', difficulty: 2 },
  ]},
  'volume-cones-spheres': { questions: [
    { q: 'What is the formula for the volume of a cone?', a: ['V = (1/3)*pi*r^2*h', 'V = one-third pi r squared h', '1/3 times pi r squared times height'], type: 'multi', difficulty: 1 },
    { q: 'What is the formula for the volume of a sphere?', a: ['V = (4/3)*pi*r^3', 'V = four-thirds pi r cubed', '4/3 times pi r cubed'], type: 'multi', difficulty: 1 },
    { q: 'How does the volume of a cone compare to the volume of a cylinder with the same base and height?', a: ['it is one-third', 'the cone is 1/3 the volume of the cylinder'], type: 'multi', difficulty: 1 },
    { q: 'A cone has a radius of 3 cm and a height of 12 cm. What is its volume?', a: ['36pi', 'about 113.1 cm^3', '36pi cm^3'], type: 'multi', difficulty: 2 },
    { q: 'A sphere has a radius of 6 cm. What is its volume?', a: ['288pi', 'about 904.8 cm^3', '288pi cm^3'], type: 'multi', difficulty: 2 },
    { q: 'True or false: The volume of a sphere depends on pi and the cube of the radius.', a: 'true', type: 'tf', difficulty: 1 },
    { q: 'A basketball has a diameter of 24 cm. What is its volume?', a: ['2304pi', 'about 7238.2 cm^3', '2304pi cm^3'], type: 'multi', difficulty: 2 },
    { q: 'An ice cream cone (radius 4 cm, height 12 cm) is filled with ice cream level to the top, then a hemisphere of ice cream sits on top. What is the total volume of ice cream?', a: ['about 268.1 cm^3', '64pi + 128pi/3 or about 268.1', '(64pi + 128pi/3)'], type: 'multi', difficulty: 3 },
  ]},
  'surface-area': { questions: [
    { q: 'What is surface area?', a: 'the total area of all the faces or surfaces of a three-dimensional figure', type: 'short', difficulty: 1 },
    { q: 'What is the surface area of a cube with edge length 5 cm?', a: ['150 cm^2', '150 square cm', '150'], type: 'multi', difficulty: 1 },
    { q: 'What is the formula for the surface area of a rectangular prism?', a: ['SA = 2(lw + lh + wh)', '2lw + 2lh + 2wh', '2 times (length times width + length times height + width times height)'], type: 'multi', difficulty: 1 },
    { q: 'A rectangular prism is 4 cm by 3 cm by 2 cm. What is its surface area?', a: ['52 cm^2', '52'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A cube has the smallest surface area for a given volume among all rectangular prisms.', a: 'true', type: 'tf', difficulty: 3 },
    { q: 'What is the surface area of a cylinder with radius 3 cm and height 10 cm? (Use pi = 3.14)', a: ['about 245.04 cm^2', '245.04', '78pi', 'about 245 cm^2'], type: 'multi', difficulty: 2 },
    { q: 'What is the formula for the surface area of a cylinder?', a: ['SA = 2*pi*r^2 + 2*pi*r*h', '2 pi r squared plus 2 pi r h', '2pi*r(r+h)'], type: 'multi', difficulty: 2 },
    { q: 'A gift box is 30 cm x 20 cm x 10 cm. How much wrapping paper is needed to cover it (surface area)?', a: ['2200 cm^2', '2200 square cm', '2200'], type: 'multi', difficulty: 2 },
  ]},

  // -- transformations -------------------------------------------------------------
  'translations': { questions: [
    { q: 'What is a translation in geometry?', a: 'sliding a figure from one position to another without rotating or flipping it', type: 'short', difficulty: 1 },
    { q: 'True or false: A translation changes the size of a figure.', a: 'false', type: 'tf', difficulty: 1 },
    { q: 'A point is at (3, 5). After a translation 4 units right and 2 units down, where is it?', a: ['(7, 3)', '7, 3'], type: 'multi', difficulty: 1 },
    { q: 'A point is at (-2, 4). After a translation of (5, -3), where is it?', a: ['(3, 1)', '3, 1'], type: 'multi', difficulty: 1 },
    { q: 'What is preserved during a translation?', a: ['shape, size, and orientation', 'the figure stays congruent to the original'], type: 'multi', difficulty: 2 },
    { q: 'A triangle has vertices (1,2), (4,2), and (1,6). After translating 3 units left, what are the new vertices?', a: ['(-2,2), (1,2), (-2,6)', '(-2, 2), (1, 2), (-2, 6)'], type: 'multi', difficulty: 2 },
    { q: 'Describe the translation that moves point A(1, 3) to A\'(6, 1).', a: ['5 units right and 2 units down', '(5, -2)', 'right 5 down 2'], type: 'multi', difficulty: 2 },
    { q: 'In coordinate notation, how do you write a translation that moves every point (x, y) to (x + a, y + b)?', a: ['(x, y) -> (x + a, y + b)', 'T(a,b)'], type: 'multi', difficulty: 2 },
  ]},
  'reflections': { questions: [
    { q: 'What is a reflection in geometry?', a: 'flipping a figure over a line to create a mirror image', type: 'short', difficulty: 1 },
    { q: 'What is the line of reflection?', a: 'the line that a figure is flipped over acting like a mirror', type: 'short', difficulty: 1 },
    { q: 'A point is at (3, 4). What is its reflection over the x-axis?', a: ['(3, -4)', '3, -4'], type: 'multi', difficulty: 1 },
    { q: 'A point is at (3, 4). What is its reflection over the y-axis?', a: ['(-3, 4)', '-3, 4'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A reflection changes the orientation of a figure.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A point is at (5, -2). Reflect it over the line y = x. Where does it end up?', a: ['(-2, 5)', '-2, 5'], type: 'multi', difficulty: 2 },
    { q: 'What is preserved during a reflection?', a: ['size and shape but orientation is reversed', 'the figure stays congruent but is flipped'], type: 'multi', difficulty: 2 },
    { q: 'A triangle has vertices (1,1), (3,1), and (2,4). Reflect it over the y-axis. What are the new vertices?', a: ['(-1,1), (-3,1), (-2,4)', '(-1, 1), (-3, 1), (-2, 4)'], type: 'multi', difficulty: 2 },
  ]},
  'rotations': { questions: [
    { q: 'What is a rotation in geometry?', a: 'turning a figure around a fixed point called the center of rotation', type: 'short', difficulty: 1 },
    { q: 'What three things do you need to know to describe a rotation?', a: 'the center of rotation, the angle of rotation, and the direction', type: 'short', difficulty: 1 },
    { q: 'A point is at (3, 0). Where is it after a 90-degree counterclockwise rotation about the origin?', a: ['(0, 3)', '0, 3'], type: 'multi', difficulty: 2 },
    { q: 'True or false: A 180-degree rotation about the origin maps (x, y) to (-x, -y).', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A point is at (2, 5). Where is it after a 180-degree rotation about the origin?', a: ['(-2, -5)', '-2, -5'], type: 'multi', difficulty: 2 },
    { q: 'A point is at (1, 0). Where is it after a 270-degree counterclockwise rotation about the origin?', a: ['(0, -1)', '0, -1'], type: 'multi', difficulty: 2 },
    { q: 'Does a rotation change the size or shape of a figure?', a: ['no', 'no it preserves size and shape'], type: 'multi', difficulty: 1 },
    { q: 'A square has a vertex at (2, 3). After a 90-degree clockwise rotation about the origin, where is this vertex?', a: ['(3, -2)', '3, -2'], type: 'multi', difficulty: 2 },
  ]},
  'dilations': { questions: [
    { q: 'What is a dilation in geometry?', a: 'a transformation that changes the size of a figure by a scale factor while keeping its shape', type: 'short', difficulty: 1 },
    { q: 'What does a scale factor greater than 1 do to a figure?', a: ['it enlarges the figure', 'makes it larger', 'the figure gets bigger'], type: 'multi', difficulty: 1 },
    { q: 'What does a scale factor between 0 and 1 do to a figure?', a: ['it shrinks the figure', 'makes it smaller', 'the figure gets smaller'], type: 'multi', difficulty: 1 },
    { q: 'A point is at (4, 6). After a dilation with scale factor 2 centered at the origin, where is it?', a: ['(8, 12)', '8, 12'], type: 'multi', difficulty: 1 },
    { q: 'True or false: A dilation preserves angle measures.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'A triangle has sides of 3, 4, and 5. After a dilation with scale factor 3, what are the new side lengths?', a: ['9, 12, and 15', '9, 12, 15'], type: 'multi', difficulty: 2 },
    { q: 'A rectangle is 6 cm by 10 cm. After a dilation with scale factor 0.5, what are its new dimensions?', a: ['3 cm by 5 cm', '3 and 5'], type: 'multi', difficulty: 2 },
    { q: 'If a figure is dilated by a scale factor of 3, by what factor does the area change?', a: ['9', 'the area is multiplied by 9', 'it increases by a factor of 9'], type: 'multi', difficulty: 3 },
  ]},
  'congruence-similarity': { questions: [
    { q: 'What does it mean for two figures to be congruent?', a: 'they have the same shape and the same size', type: 'short', difficulty: 1 },
    { q: 'What does it mean for two figures to be similar?', a: 'they have the same shape but not necessarily the same size', type: 'short', difficulty: 1 },
    { q: 'Which transformations produce congruent figures?', a: ['translations, reflections, and rotations', 'rigid motions'], type: 'multi', difficulty: 1 },
    { q: 'Which transformation produces similar but not congruent figures?', a: ['dilation', 'a dilation with scale factor not equal to 1'], type: 'multi', difficulty: 1 },
    { q: 'True or false: All congruent figures are similar, but not all similar figures are congruent.', a: 'true', type: 'tf', difficulty: 2 },
    { q: 'Two similar triangles have a scale factor of 4. If the smaller triangle has a perimeter of 15 cm, what is the perimeter of the larger?', a: ['60 cm', '60'], type: 'multi', difficulty: 2 },
    { q: 'Two similar rectangles have a scale factor of 3. If the smaller has an area of 12 cm^2, what is the area of the larger?', a: ['108 cm^2', '108'], type: 'multi', difficulty: 2 },
    { q: 'Explain how you can use a sequence of transformations to show that two figures are congruent.', a: 'if you can map one figure exactly onto the other using only translations reflections and rotations then the figures are congruent', type: 'open', difficulty: 3 },
  ]},
};

// ===============================================================================
// HINT BANKS -- 3-tier progressive hints per skill
// ===============================================================================

const HINT_BANKS = {
  // angles-lines
  'angle-types': { tier1: 'Think about the size of the angle compared to a square corner (90 degrees).', tier2: 'Acute < 90, Right = 90, Obtuse > 90 and < 180, Straight = 180, Reflex > 180 and < 360.', tier3: 'Example: 45 degrees is acute. 120 degrees is obtuse. 90 degrees is a right angle.' },
  'complementary-supplementary': { tier1: 'Complementary angles add to a right angle. Supplementary angles add to a straight line.', tier2: 'Complementary: a + b = 90. Supplementary: a + b = 180. Subtract the given angle from 90 or 180.', tier3: 'Example: Complement of 35 degrees = 90 - 35 = 55. Supplement of 110 degrees = 180 - 110 = 70.' },
  'vertical-angles': { tier1: 'When two lines cross, the angles across from each other are equal.', tier2: 'Vertical angles are congruent. Adjacent angles on a straight line are supplementary (add to 180).', tier3: 'Example: If one angle is 70 degrees, the vertical angle is 70. The adjacent angles are 180 - 70 = 110 degrees.' },
  'parallel-lines-transversals': { tier1: 'When a line crosses two parallel lines, it creates matching angle pairs.', tier2: 'Corresponding angles are equal. Alternate interior angles are equal. Co-interior angles add to 180.', tier3: 'Example: If one angle is 65 degrees, its corresponding angle = 65. The co-interior angle = 180 - 65 = 115.' },
  'angle-relationships': { tier1: 'Angles on a line add to 180. Angles around a point add to 360.', tier2: 'A linear pair = two adjacent supplementary angles. Vertical angles are congruent.', tier3: 'Example: Three angles on a line: 50 + 60 + x = 180, so x = 70.' },

  // triangles
  'triangle-types': { tier1: 'Classify by sides: equilateral (all equal), isosceles (two equal), scalene (none equal).', tier2: 'Also classify by angles: acute (all < 90), right (one = 90), obtuse (one > 90).', tier3: 'Example: 3, 3, 3 cm = equilateral. 5, 5, 8 cm = isosceles. 3, 4, 6 cm = scalene.' },
  'triangle-angle-sum': { tier1: 'All three angles inside any triangle always add up to the same number.', tier2: 'Sum of interior angles = 180 degrees. If you know two, subtract from 180 to find the third.', tier3: 'Example: Angles 50 and 70 degrees. Third angle = 180 - 50 - 70 = 60 degrees.' },
  'pythagorean-theorem': { tier1: 'In a right triangle, the two shorter sides relate to the longest side in a special way.', tier2: 'a^2 + b^2 = c^2, where c is the hypotenuse (longest side, opposite the right angle). Solve for the unknown.', tier3: 'Example: Legs 3 and 4. 3^2 + 4^2 = 9 + 16 = 25. c = sqrt(25) = 5.' },
  'pythagorean-applications': { tier1: 'Draw the situation and look for a right triangle hiding in the problem.', tier2: 'Real-world right triangles: ladders against walls, diagonals of rectangles, distances between two points.', tier3: 'Example: Ladder 10 ft, base 6 ft from wall. Height = sqrt(10^2 - 6^2) = sqrt(64) = 8 ft.' },
  'triangle-inequality': { tier1: 'Any two sides of a triangle must add up to more than the third side.', tier2: 'Check all three pairs: a + b > c, a + c > b, b + c > a. If any fails, no triangle.', tier3: 'Example: Sides 3, 4, 8. Check: 3 + 4 = 7, which is NOT > 8. No triangle possible.' },

  // polygons-circles
  'polygon-properties': { tier1: 'A polygon is named by its number of sides. Regular = all sides and angles equal.', tier2: 'Sum of interior angles = (n - 2) x 180. Each angle of a regular n-gon = (n - 2) x 180 / n.', tier3: 'Example: Pentagon has 5 sides. Sum = (5-2) x 180 = 540 degrees. Each angle of a regular pentagon = 108 degrees.' },
  'area-parallelograms': { tier1: 'A parallelogram is like a slanted rectangle. Use base times height, not base times side.', tier2: 'A = base x height. The height must be perpendicular to the base, not the slant height.', tier3: 'Example: Base 8 cm, height 5 cm. A = 8 x 5 = 40 cm^2.' },
  'area-triangles': { tier1: 'A triangle is half of a parallelogram with the same base and height.', tier2: 'A = (1/2) x base x height. The height is perpendicular to the base.', tier3: 'Example: Base 10 cm, height 6 cm. A = (1/2)(10)(6) = 30 cm^2.' },
  'area-circles': { tier1: 'The area of a circle depends on pi and the radius.', tier2: 'A = pi x r^2. If given the diameter, divide by 2 to get the radius first.', tier3: 'Example: Radius 5. A = pi x 25 = 25pi, which is about 78.5 square units.' },
  'circumference': { tier1: 'Circumference is the distance around a circle. It depends on pi and the diameter or radius.', tier2: 'C = 2 x pi x r, or C = pi x d. Pi is approximately 3.14.', tier3: 'Example: Radius 7. C = 2 x 3.14 x 7 = 43.96.' },
  'composite-shapes': { tier1: 'Break the shape into rectangles, triangles, and circles you already know how to handle.', tier2: 'Add areas of parts that make up the shape. Subtract areas of holes or removed sections.', tier3: 'Example: Rectangle 10x8 with a circular hole (r=2). Area = 80 - pi(4) = 80 - 12.57 = 67.43.' },

  // volume-surface-area
  'volume-prisms': { tier1: 'Volume is how much space a 3D shape takes up. For prisms, think layers of the base shape.', tier2: 'V = Base area x height. For a rectangular prism: V = l x w x h.', tier3: 'Example: Rectangular prism 4x5x6. V = 4 x 5 x 6 = 120 cm^3.' },
  'volume-cylinders': { tier1: 'A cylinder is like a stack of circles. The volume relates to the circle area and height.', tier2: 'V = pi x r^2 x h. Find the area of the circular base, then multiply by the height.', tier3: 'Example: Radius 3, height 10. V = pi x 9 x 10 = 90pi, about 282.7 cubic units.' },
  'volume-cones-spheres': { tier1: 'A cone is one-third of a cylinder. A sphere has a special formula with r^3.', tier2: 'Cone: V = (1/3) pi r^2 h. Sphere: V = (4/3) pi r^3.', tier3: 'Example: Cone with r=3, h=12. V = (1/3)(pi)(9)(12) = 36pi. Sphere with r=6. V = (4/3)(pi)(216) = 288pi.' },
  'surface-area': { tier1: 'Surface area is like wrapping paper: add up the area of every face.', tier2: 'Rectangular prism: SA = 2(lw + lh + wh). Cylinder: SA = 2 pi r^2 + 2 pi r h.', tier3: 'Example: Cube with edge 5. SA = 6 x 25 = 150 cm^2.' },

  // transformations
  'translations': { tier1: 'A translation is just a slide. Every point moves the same distance in the same direction.', tier2: 'Add the translation values to each coordinate: (x, y) -> (x + a, y + b).', tier3: 'Example: (3, 5) translated 4 right and 2 down -> (3+4, 5-2) = (7, 3).' },
  'reflections': { tier1: 'A reflection is a flip over a line. Think of a mirror image.', tier2: 'Over x-axis: (x, y) -> (x, -y). Over y-axis: (x, y) -> (-x, y).', tier3: 'Example: (3, 4) reflected over x-axis -> (3, -4). Over y-axis -> (-3, 4).' },
  'rotations': { tier1: 'A rotation is a turn around a fixed point by a certain angle.', tier2: '90 degrees CCW about origin: (x, y) -> (-y, x). 180 degrees: (x, y) -> (-x, -y). 270 degrees CCW: (x, y) -> (y, -x).', tier3: 'Example: (3, 0) rotated 90 degrees CCW -> (0, 3).' },
  'dilations': { tier1: 'A dilation makes a figure bigger or smaller but keeps the same shape.', tier2: 'Scale factor > 1 = enlargement. Scale factor between 0 and 1 = reduction. Multiply each coordinate by the scale factor.', tier3: 'Example: (4, 6) dilated by scale factor 2 from origin -> (8, 12).' },
  'congruence-similarity': { tier1: 'Congruent = same shape AND size. Similar = same shape, different size allowed.', tier2: 'Translations, reflections, rotations = congruent. Dilation = similar. Scale factor of 1 = congruent.', tier3: 'Example: A 3-4-5 triangle and a 6-8-10 triangle are similar (scale factor 2) but not congruent.' },
};

// ===============================================================================
// MISCONCEPTIONS -- pattern-matched corrections per skill
// ===============================================================================

const MISCONCEPTIONS = {
  'angle-types': [
    { patterns: [/right.*90.*obtuse|obtuse.*right/i], correction: 'A right angle is exactly 90 degrees. An obtuse angle is strictly between 90 and 180 degrees. They are different types. If an angle is exactly 90 degrees, it is a right angle, not obtuse.' },
  ],
  'complementary-supplementary': [
    { patterns: [/complementary.*180|supplementary.*90/i], correction: 'Complementary angles add to 90 degrees (think "C" for "Corner" = 90). Supplementary angles add to 180 degrees (think "S" for "Straight line" = 180). Do not mix them up.' },
  ],
  'vertical-angles': [
    { patterns: [/vertical.*supplementary|vertical.*180|vertical.*add/i], correction: 'Vertical angles are NOT supplementary. Vertical angles are congruent (equal). It is the ADJACENT angles that are supplementary (add to 180). Vertical angles are the ones directly across from each other when two lines cross.' },
  ],
  'parallel-lines-transversals': [
    { patterns: [/alternate.*supplementary|corresponding.*supplementary/i], correction: 'Alternate interior angles and corresponding angles are CONGRUENT (equal), not supplementary. Only co-interior (same-side interior) angles are supplementary (add to 180) when formed by a transversal cutting parallel lines.' },
  ],
  'triangle-angle-sum': [
    { patterns: [/triangle.*360|angles.*360/i], correction: 'The interior angles of a triangle sum to 180 degrees, not 360. You may be thinking of angles around a point (360) or a quadrilateral (360). Remember: triangle = 180 degrees.' },
  ],
  'pythagorean-theorem': [
    { patterns: [/any.*triangle|all.*triangle|works.*every/i], correction: 'The Pythagorean theorem (a^2 + b^2 = c^2) ONLY works for right triangles. The hypotenuse c must be the side opposite the right angle. For non-right triangles, you need different methods like the law of cosines.' },
    { patterns: [/add.*sides|a.*plus.*b.*equals.*c/i], correction: 'The Pythagorean theorem is a^2 + b^2 = c^2, NOT a + b = c. You must square the sides before adding. For legs 3 and 4: 3^2 + 4^2 = 9 + 16 = 25, then c = sqrt(25) = 5, not 3 + 4 = 7.' },
  ],
  'area-circles': [
    { patterns: [/area.*pi.*d|area.*diameter/i], correction: 'The area formula uses the RADIUS, not the diameter. A = pi*r^2. If given the diameter, divide by 2 first to get the radius. A common mistake is using the diameter directly in the formula.' },
    { patterns: [/area.*2.*pi.*r|area.*circumference/i], correction: 'A = pi*r^2 is the area formula. C = 2*pi*r is the CIRCUMFERENCE formula. Do not confuse them. Area uses r-squared; circumference uses 2r.' },
  ],
  'circumference': [
    { patterns: [/circumference.*r.*squared|circumference.*r\^2/i], correction: 'Circumference = 2*pi*r or pi*d. There is no squaring involved. You may be confusing circumference with area (A = pi*r^2). Circumference measures distance around; area measures space inside.' },
  ],
  'volume-prisms': [
    { patterns: [/double.*double.*volume|twice.*twice.*volume/i], correction: 'Doubling ALL dimensions of a rectangular prism does NOT just double the volume. It multiplies the volume by 2 x 2 x 2 = 8. Volume depends on three dimensions, so each doubling multiplies the effect.' },
  ],
  'volume-cylinders': [
    { patterns: [/volume.*pi.*r.*h$|volume.*pi.*r.*h[^2]/i], correction: 'The volume of a cylinder is V = pi*r^2*h, not pi*r*h. You must SQUARE the radius. The base of a cylinder is a circle with area pi*r^2, and then you multiply by height.' },
  ],
  'surface-area': [
    { patterns: [/surface.*same.*volume|volume.*surface/i], correction: 'Surface area and volume are different measurements. Surface area measures the total area of all outer faces (in square units). Volume measures the space inside (in cubic units). They have different formulas and different units.' },
  ],
  'dilations': [
    { patterns: [/dilation.*congruent|dilation.*same.*size/i], correction: 'A dilation (with scale factor not equal to 1) produces a SIMILAR figure, not a congruent one. Similar figures have the same shape but different sizes. Only rigid motions (translations, reflections, rotations) produce congruent figures.' },
  ],
  'congruence-similarity': [
    { patterns: [/similar.*same.*size|similar.*congruent.*same/i], correction: 'Similar figures have the same SHAPE but not necessarily the same size. Congruent figures have both the same shape AND the same size. All congruent figures are similar, but similar figures are only congruent if the scale factor is 1.' },
  ],
};

// ===============================================================================
// PHENOMENA -- driving questions for phenomenon-based learning
// ===============================================================================

const PHENOMENA = {
  'angles-lines': [
    { title: 'The Leaning Tower of Pisa', focus: 'angle measurement, angle types', text: 'The Leaning Tower of Pisa tilts at about 3.97 degrees from vertical. Engineers have worked for decades to prevent it from falling.', drivingQuestion: 'How can you use angle measurements to determine if the tower is safe? What angle from vertical would be dangerous, and how do engineers monitor the tilt?' },
    { title: 'Parallel Lines in Architecture', focus: 'parallel lines, transversals, angle relationships', text: 'Railroad tracks are designed to be perfectly parallel. When a road crosses the tracks, it creates a transversal. Engineers must ensure vehicles can safely cross at any angle.', drivingQuestion: 'If a road crosses parallel tracks at a 60-degree angle, what angles are formed at each crossing? Why must corresponding angles be equal for the crossing to work properly?' },
  ],
  'triangles': [
    { title: 'Bridge Truss Design', focus: 'triangles, Pythagorean theorem, triangle types', text: 'Engineers use triangular trusses in bridges because triangles are the strongest geometric shape. A triangular truss cannot be deformed without changing the length of its sides.', drivingQuestion: 'Why are triangles used instead of rectangles in bridges? Use the triangle inequality and rigidity of triangles to explain the structural advantage.' },
    { title: 'Finding Heights with Shadows', focus: 'similar triangles, Pythagorean theorem', text: 'On a sunny day, a 6-foot person casts a 4-foot shadow at the same time a tree casts a 20-foot shadow.', drivingQuestion: 'How tall is the tree? Use similar triangles to find the answer. Then use the Pythagorean theorem to find the distance from the top of the tree to the tip of its shadow.' },
  ],
  'polygons-circles': [
    { title: 'Honeycomb Geometry', focus: 'polygon properties, area, tessellation', text: 'Bees build honeycombs using regular hexagons. Mathematicians have proven that hexagons are the most efficient shape for covering a flat surface with the least amount of wax.', drivingQuestion: 'Why do bees use hexagons instead of squares or triangles? Calculate the area covered by hexagons versus circles of the same size. What makes hexagons efficient?' },
    { title: 'Pizza Economics', focus: 'area of circles, circumference', text: 'A pizza shop sells a 10-inch diameter pizza for $8 and a 14-inch diameter pizza for $12. A customer wants to know which is the better deal.', drivingQuestion: 'Calculate the area of each pizza and the price per square inch. Which pizza is the better value? Why does a small increase in diameter lead to a large increase in area?' },
  ],
  'volume-surface-area': [
    { title: 'Packaging Design Challenge', focus: 'volume, surface area, optimization', text: 'A cereal company wants to redesign their box to use less cardboard while holding the same volume of cereal (3000 cm^3). The current box is 30 cm x 20 cm x 5 cm.', drivingQuestion: 'Calculate the current surface area. Can you find a box with the same volume but less surface area? What shape minimizes surface area for a given volume?' },
    { title: 'Giant Water Tank', focus: 'volume of cylinders, capacity', text: 'A town needs a cylindrical water tank that holds at least 50,000 liters. The tank height cannot exceed 5 meters due to building codes.', drivingQuestion: 'What is the minimum radius needed? If the tank is too wide, they can make it taller (up to 5 m). Find the dimensions that minimize material used (surface area).' },
  ],
  'transformations': [
    { title: 'Symmetry in Nature', focus: 'reflections, rotational symmetry', text: 'Butterflies have bilateral symmetry (one line of reflection). Starfish have 5-fold rotational symmetry. Snowflakes have 6-fold rotational symmetry.', drivingQuestion: 'Identify the transformations that map each organism onto itself. How many lines of symmetry does a regular hexagon have? What rotation angles map a starfish onto itself?' },
    { title: 'Video Game Sprites', focus: 'translations, reflections, rotations, dilations', text: 'A game designer creates a spaceship sprite at position (2, 3) on a 20x20 grid. The ship needs to move, turn, flip, and scale during gameplay.', drivingQuestion: 'Describe the transformation needed to: (1) move the ship to (10, 8), (2) flip it horizontally, (3) rotate it 90 degrees, (4) make it twice as large. Write each as a coordinate rule.' },
  ],
};

// ===============================================================================
// VIRTUAL LABS
// ===============================================================================

const VIRTUAL_LABS = {
  'area-model': {
    title: 'Virtual Area Model Lab',
    skills: ['area-parallelograms', 'area-triangles', 'area-circles', 'composite-shapes'],
    objective: 'Discover and verify area formulas by decomposing and rearranging shapes on a grid',
    background: 'Area measures the space inside a two-dimensional figure. By cutting and rearranging shapes, we can derive formulas. A parallelogram can be cut and rearranged into a rectangle. A triangle is half a parallelogram. A circle can be cut into sectors and rearranged into an approximate rectangle.',
    hypothesis_prompt: 'Predict: If you cut a parallelogram along its height and rearrange the pieces, what shape do you get? How does the area of a triangle compare to a parallelogram with the same base and height?',
    variables: { independent: 'shape type, base length (cm), height (cm)', dependent: 'area (cm^2)', controlled: ['grid square size = 1 cm^2', 'measurement method'] },
    procedure: [
      { step: 1, action: 'Draw a parallelogram with base 8 cm and height 5 cm on grid paper. Cut along the height to form a right triangle and a trapezoid. Rearrange to form a rectangle. Record the rectangle dimensions and area.' },
      { step: 2, action: 'Draw two identical triangles with base 10 cm and height 6 cm. Arrange them to form a parallelogram. Record the parallelogram dimensions and area. Divide by 2 for the triangle area.' },
      { step: 3, action: 'Cut a circle (radius 5 cm) into 16 equal sectors. Arrange them alternating point-up and point-down to approximate a rectangle. Measure the approximate length and width.' },
      { step: 4, action: 'Create a composite shape (rectangle 12x8 with a semicircle on one end, radius 4). Calculate total area by adding parts.' },
      { step: 5, action: 'Verify all calculations by counting grid squares.' },
    ],
    observations: {
      'parallelogram-rearrange': 'Parallelogram (base 8, height 5) cut and rearranged into rectangle 8 cm x 5 cm. Area = 40 cm^2. The formula A = bh is confirmed.',
      'triangle-double': 'Two identical triangles (base 10, height 6) form a parallelogram with area 60 cm^2. Each triangle = 30 cm^2 = (1/2)(10)(6). Formula A = (1/2)bh confirmed.',
      'circle-sectors': 'Circle (r=5) cut into 16 sectors rearranges to approximate rectangle with length = pi*r = 15.7 cm and width = r = 5 cm. Area = 15.7 x 5 = 78.5 cm^2 = pi*r^2. Formula confirmed.',
      'composite-calculation': 'Rectangle 12x8 = 96 cm^2. Semicircle radius 4 = (1/2)(pi)(16) = 25.13 cm^2. Total = 96 + 25.13 = 121.13 cm^2.',
    },
    data_table: {
      columns: ['Shape', 'Base/Radius', 'Height', 'Formula', 'Calculated Area', 'Grid Count'],
      rows: [
        ['Parallelogram', '8 cm', '5 cm', 'b x h', '40 cm^2', '40 squares'],
        ['Triangle', '10 cm', '6 cm', '(1/2)bh', '30 cm^2', '30 squares'],
        ['Circle', 'r = 5 cm', '-', 'pi*r^2', '78.5 cm^2', '~79 squares'],
        ['Composite', '12 cm + r=4', '8 cm', 'rect + semi', '121.13 cm^2', '~121 squares'],
      ],
    },
    conclusion_questions: [
      'How does rearranging a parallelogram into a rectangle prove the formula A = bh?',
      'Why is the area of a triangle exactly half the area of a parallelogram with the same base and height?',
      'When you rearranged the circle sectors, what were the approximate dimensions of the rectangle? How do they relate to pi and r?',
      'For the composite shape, explain your strategy for breaking it into simpler shapes.',
      'If you doubled the radius of the circle, predict the new area. By what factor does it increase?',
    ],
  },
  'transformation-tour': {
    title: 'Virtual Transformation Tour Lab',
    skills: ['translations', 'reflections', 'rotations', 'dilations', 'congruence-similarity'],
    objective: 'Explore how translations, reflections, rotations, and dilations change (or preserve) figures on a coordinate grid',
    background: 'Transformations are rules that move or change figures. Rigid motions (translations, reflections, rotations) preserve size and shape, producing congruent figures. Dilations change size but preserve shape, producing similar figures.',
    hypothesis_prompt: 'Predict: After reflecting a triangle over the y-axis, will the triangle face the same direction? After rotating it 180 degrees, where will the vertices end up?',
    variables: { independent: 'transformation type, transformation parameters', dependent: 'new vertex coordinates, shape properties', controlled: ['original triangle vertices: (1,1), (4,1), (1,3)', 'coordinate grid'] },
    procedure: [
      { step: 1, action: 'Plot triangle ABC with A(1,1), B(4,1), C(1,3). Translate it by (3, 2). Record new vertices.' },
      { step: 2, action: 'Starting from the original, reflect over the y-axis. Record new vertices. Compare side lengths and angles.' },
      { step: 3, action: 'Starting from the original, rotate 90 degrees counterclockwise about the origin. Record new vertices.' },
      { step: 4, action: 'Starting from the original, rotate 180 degrees about the origin. Record new vertices.' },
      { step: 5, action: 'Starting from the original, dilate by scale factor 2 from the origin. Record new vertices. Compare side lengths.' },
    ],
    observations: {
      'translation': 'Translation (3,2): A(1,1)->A\'(4,3), B(4,1)->B\'(7,3), C(1,3)->C\'(4,5). Side lengths unchanged. Angles unchanged. Orientation unchanged. Congruent to original.',
      'reflection-y': 'Reflect over y-axis: A(1,1)->A\'(-1,1), B(4,1)->B\'(-4,1), C(1,3)->C\'(-1,3). Side lengths unchanged. Angles unchanged. Orientation REVERSED (mirror image). Congruent.',
      'rotation-90': 'Rotate 90 CCW: A(1,1)->A\'(-1,1), B(4,1)->B\'(-1,4), C(1,3)->C\'(-3,1). Side lengths unchanged. Angles unchanged. Orientation preserved. Congruent.',
      'rotation-180': 'Rotate 180: A(1,1)->A\'(-1,-1), B(4,1)->B\'(-4,-1), C(1,3)->C\'(-1,-3). Equivalent to reflecting over both axes. Congruent.',
      'dilation-2': 'Dilation factor 2: A(1,1)->A\'(2,2), B(4,1)->B\'(8,2), C(1,3)->C\'(2,6). Side lengths doubled. Angles unchanged. Similar but NOT congruent.',
    },
    data_table: {
      columns: ['Transformation', 'A\'', 'B\'', 'C\'', 'Side Lengths', 'Angles', 'Congruent?'],
      rows: [
        ['Original', '(1,1)', '(4,1)', '(1,3)', '3, 2, sqrt(13)', '90, ~56, ~34', '-'],
        ['Translate (3,2)', '(4,3)', '(7,3)', '(4,5)', '3, 2, sqrt(13)', '90, ~56, ~34', 'Yes'],
        ['Reflect y-axis', '(-1,1)', '(-4,1)', '(-1,3)', '3, 2, sqrt(13)', '90, ~56, ~34', 'Yes'],
        ['Rotate 90 CCW', '(-1,1)', '(-1,4)', '(-3,1)', '3, 2, sqrt(13)', '90, ~56, ~34', 'Yes'],
        ['Rotate 180', '(-1,-1)', '(-4,-1)', '(-1,-3)', '3, 2, sqrt(13)', '90, ~56, ~34', 'Yes'],
        ['Dilation x2', '(2,2)', '(8,2)', '(2,6)', '6, 4, 2sqrt(13)', '90, ~56, ~34', 'No (similar)'],
      ],
    },
    conclusion_questions: [
      'Which transformations preserved both size and shape (produced congruent figures)?',
      'Which transformation changed the size but preserved the shape (produced a similar figure)?',
      'After reflecting over the y-axis, how did the orientation of the triangle change? Was it still congruent?',
      'After the dilation by factor 2, by what factor did the area change? Why?',
      'Can you describe a sequence of two transformations that would map the original triangle to a triangle at (-2,-2), (-8,-2), (-2,-6)?',
    ],
  },
  'pythagorean-investigation': {
    title: 'Virtual Pythagorean Theorem Investigation Lab',
    skills: ['pythagorean-theorem', 'pythagorean-applications', 'triangle-types'],
    objective: 'Verify the Pythagorean theorem using area models and investigate Pythagorean triples',
    background: 'The Pythagorean theorem states that in a right triangle with legs a and b and hypotenuse c, a^2 + b^2 = c^2. This can be visualized by drawing squares on each side of the triangle.',
    hypothesis_prompt: 'Predict: If you draw squares on each side of a 3-4-5 right triangle, what will the areas be? Will the two smaller squares together equal the large square?',
    variables: { independent: 'triangle side lengths', dependent: 'square areas, whether a^2 + b^2 = c^2', controlled: ['right angle verified with protractor', 'grid paper squares'] },
    procedure: [
      { step: 1, action: 'Draw a 3-4-5 right triangle. Build squares on each side. Count grid squares in each: a^2, b^2, c^2. Verify a^2 + b^2 = c^2.' },
      { step: 2, action: 'Repeat with a 5-12-13 right triangle. Verify the theorem.' },
      { step: 3, action: 'Try sides 3-4-6 (not a right triangle). Check if a^2 + b^2 = c^2.' },
      { step: 4, action: 'Generate Pythagorean triples: try (6,8,?), (8,15,?), (7,24,?). Calculate hypotenuses.' },
      { step: 5, action: 'Real-world application: A ladder reaches 12 feet up a wall. The base is 5 feet from the wall. Find the ladder length.' },
    ],
    observations: {
      'triple-3-4-5': '3-4-5 triangle: Squares have areas 9, 16, 25. Sum of smaller: 9 + 16 = 25. Equals largest square! Theorem verified.',
      'triple-5-12-13': '5-12-13 triangle: Squares have areas 25, 144, 169. Sum: 25 + 144 = 169. Verified!',
      'not-right-3-4-6': '3-4-6 triangle: 9 + 16 = 25, but 6^2 = 36. 25 ≠ 36. NOT a right triangle (it is obtuse because c^2 > a^2 + b^2).',
      'generate-triples': '(6,8,10): 36+64=100, c=10. (8,15,17): 64+225=289, c=17. (7,24,25): 49+576=625, c=25. All are Pythagorean triples!',
      'ladder-problem': 'Ladder: a=5, b=12. c^2 = 25 + 144 = 169. c = 13 feet. The ladder is 13 feet long.',
    },
    data_table: {
      columns: ['Triangle', 'a', 'b', 'c', 'a^2', 'b^2', 'c^2', 'a^2 + b^2 = c^2?'],
      rows: [
        ['3-4-5', '3', '4', '5', '9', '16', '25', 'Yes (25=25)'],
        ['5-12-13', '5', '12', '13', '25', '144', '169', 'Yes (169=169)'],
        ['3-4-6', '3', '4', '6', '9', '16', '36', 'No (25≠36)'],
        ['6-8-10', '6', '8', '10', '36', '64', '100', 'Yes (100=100)'],
        ['8-15-17', '8', '15', '17', '64', '225', '289', 'Yes (289=289)'],
        ['7-24-25', '7', '24', '25', '49', '576', '625', 'Yes (625=625)'],
      ],
    },
    conclusion_questions: [
      'Does the Pythagorean theorem hold for all six right triangles tested? Show your evidence.',
      'For the 3-4-6 triangle (not right), what did you notice about a^2 + b^2 compared to c^2?',
      'The triples (3,4,5) and (6,8,10) are related. How? Can you generate more triples from (3,4,5)?',
      'In the ladder problem, what happens if the base moves to 9 feet from the wall? How high does the ladder reach now?',
      'A student claims any three numbers can form a right triangle. Use your data to explain why this is wrong.',
    ],
  },
  'volume-exploration': {
    title: 'Virtual Volume Exploration Lab',
    skills: ['volume-prisms', 'volume-cylinders', 'volume-cones-spheres', 'surface-area'],
    objective: 'Compare the volumes and surface areas of prisms, cylinders, cones, and spheres with the same dimensions',
    background: 'Volume measures the space inside a 3D figure. Different shapes with the same dimensions can have very different volumes. A cone is 1/3 the volume of a cylinder with the same base and height. A sphere has a unique relationship: its volume equals 2/3 of the cylinder that just contains it.',
    hypothesis_prompt: 'Predict: If a cylinder, cone, and sphere all have radius 5 cm and the cylinder and cone have height 10 cm, which has the greatest volume? Rank them.',
    variables: { independent: 'shape type (prism, cylinder, cone, sphere)', dependent: 'volume (cm^3), surface area (cm^2)', controlled: ['radius = 5 cm', 'height = 10 cm where applicable'] },
    procedure: [
      { step: 1, action: 'Calculate the volume of a rectangular prism 10 x 10 x 10 cm (cube). Then calculate the volume of a cylinder with radius 5 cm and height 10 cm that fits inside it.' },
      { step: 2, action: 'Calculate the volume of a cone with radius 5 cm and height 10 cm. Compare to the cylinder.' },
      { step: 3, action: 'Calculate the volume of a sphere with radius 5 cm. Compare to the cylinder.' },
      { step: 4, action: 'Calculate the surface area of each shape.' },
      { step: 5, action: 'Determine which shape has the best volume-to-surface-area ratio.' },
    ],
    observations: {
      'cube-vs-cylinder': 'Cube (10x10x10): V = 1000 cm^3. Cylinder (r=5, h=10): V = pi(25)(10) = 250pi = 785.4 cm^3. The cylinder fits inside the cube but has 78.5% of its volume.',
      'cone-volume': 'Cone (r=5, h=10): V = (1/3)pi(25)(10) = 250pi/3 = 261.8 cm^3. Exactly 1/3 of the cylinder!',
      'sphere-volume': 'Sphere (r=5): V = (4/3)pi(125) = 500pi/3 = 523.6 cm^3. This is 2/3 of the cylinder volume.',
      'surface-areas': 'Cube SA = 600 cm^2. Cylinder SA = 2pi(25) + 2pi(5)(10) = 150pi = 471.2 cm^2. Sphere SA = 4pi(25) = 100pi = 314.2 cm^2.',
      'ratio-comparison': 'Volume/SA ratios: Cube = 1000/600 = 1.67. Cylinder = 785.4/471.2 = 1.67. Sphere = 523.6/314.2 = 1.67. Remarkably similar for these dimensions! But the sphere always has the best ratio for a given volume.',
    },
    data_table: {
      columns: ['Shape', 'Dimensions', 'Volume', 'Surface Area', 'V/SA Ratio'],
      rows: [
        ['Cube', '10x10x10', '1000 cm^3', '600 cm^2', '1.67'],
        ['Cylinder', 'r=5, h=10', '785.4 cm^3', '471.2 cm^2', '1.67'],
        ['Cone', 'r=5, h=10', '261.8 cm^3', '254.2 cm^2', '1.03'],
        ['Sphere', 'r=5', '523.6 cm^3', '314.2 cm^2', '1.67'],
      ],
    },
    conclusion_questions: [
      'The cone is exactly what fraction of the cylinder volume? Does this match the formula?',
      'The sphere is exactly what fraction of the cylinder volume (with diameter = height = 2r)?',
      'Which shape has the smallest surface area for a given volume? Why does this matter in nature (cells, bubbles)?',
      'If you triple the radius of a sphere, by what factor does the volume increase? The surface area?',
      'A factory needs to ship the most product in the least packaging. Which shape should they choose and why?',
    ],
  },
};

// ===============================================================================
// DIAGRAMS -- ASCII diagrams for key concepts
// ===============================================================================

const DIAGRAMS_LOCAL = {
  'angle-types-diagram': {
    domain: 'ms-math-geometry',
    skill: 'angle-types',
    topic: 'Types of Angles',
    description: 'Four angles to classify by type based on their appearance.',
    diagram: `
          [A]            [B]           [C]           [D]
          |              |              |
          |              |               \\
          |___           |____            \\___
          90 deg         45 deg           135 deg       180 deg
                                                     ___________

  Label [A]: _______________ angle
  Label [B]: _______________ angle
  Label [C]: _______________ angle
  Label [D]: _______________ angle
`,
    labels: { A: 'right', B: 'acute', C: 'obtuse', D: 'straight' },
  },
  'parallel-lines-transversal': {
    domain: 'ms-math-geometry',
    skill: 'parallel-lines-transversals',
    topic: 'Parallel Lines Cut by a Transversal',
    description: 'Two parallel lines cut by a transversal with eight angles to identify.',
    diagram: `
             /
            / [1] [2]
  ==========/=========  line m
          / [3] [4]
         /
        / [5] [6]
  =====/=============  line n
      / [7] [8]
     /

  Lines m and n are parallel.

  If angle [1] = 120 degrees:
  Angle [2] = ___ degrees (linear pair with [1])
  Angle [3] = ___ degrees (vertical with [2])
  Angle [5] = ___ degrees (corresponding with [1])
  Angle [6] = ___ degrees (alternate interior with [3])
`,
    labels: { '[2]': '60', '[3]': '60', '[5]': '120', '[6]': '60' },
  },
  'triangle-angle-sum-diagram': {
    domain: 'ms-math-geometry',
    skill: 'triangle-angle-sum',
    topic: 'Triangle Angle Sum',
    description: 'A triangle with two angles given and one to find.',
    diagram: `
        /\\
       /  \\
      / [C] \\
     /        \\
    /          \\
   /[A]____[B]__\\

  Angle [A] = 55 degrees
  Angle [B] = 80 degrees
  Angle [C] = ___ degrees
  Sum of all angles = ___ degrees
`,
    labels: { C: '45', 'Sum': '180' },
  },
  'pythagorean-theorem-diagram': {
    domain: 'ms-math-geometry',
    skill: 'pythagorean-theorem',
    topic: 'Pythagorean Theorem with Squares',
    description: 'A right triangle with squares drawn on each side to visualize a^2 + b^2 = c^2.',
    diagram: `
       +-----+
       |     |  Area = [C]
       | c^2 |
       +-----+------+
        \\     |      |
      c  \\    | b=4  | Area = [B]
          \\   |      |
           \\  |      |
            \\ +------+
             \\|
              +---+---+
              |  a=3  |
              | Area  |
              | = [A] |
              +-------+

  Area of square on side a: [A] = ___
  Area of square on side b: [B] = ___
  Area of square on side c: [C] = ___
  So c = ___
`,
    labels: { A: '9', B: '16', C: '25', 'c': '5' },
  },
  'circle-parts': {
    domain: 'ms-math-geometry',
    skill: 'circumference',
    topic: 'Parts of a Circle',
    description: 'A circle with key parts labeled.',
    diagram: `
          ____[A]____
        /      |      \\
       /       |       \\
      |        | [B]    |
      |   [D]--+--------| [C]
      |        |        |
       \\       |       /
        \\______|______/

  Label [A]: _______________ (curved distance around)
  Label [B]: _______________ (center to edge)
  Label [C]: _______________ (edge to edge through center)
  Label [D]: _______________ (center point)
`,
    labels: { A: 'circumference', B: 'radius', C: 'diameter', D: 'center' },
  },
  'composite-shape': {
    domain: 'ms-math-geometry',
    skill: 'composite-shapes',
    topic: 'Finding Area of a Composite Shape',
    description: 'An L-shaped figure to decompose and calculate area.',
    diagram: `
  +-------+
  |       |  4 cm
  |       +-------+
  |       |       |
  |       |       | 3 cm
  |       |       |
  +-------+-------+
    5 cm     5 cm

  Shape [A] (left rectangle): ___ cm x ___ cm = ___ cm^2
  Shape [B] (right rectangle): ___ cm x ___ cm = ___ cm^2
  Total area: ___ cm^2
`,
    labels: { 'Shape A': '5 x 7 = 35', 'Shape B': '5 x 3 = 15', 'Total area': '50' },
  },
  'volume-prism-diagram': {
    domain: 'ms-math-geometry',
    skill: 'volume-prisms',
    topic: 'Volume of a Rectangular Prism',
    description: 'A rectangular prism with dimensions to calculate volume.',
    diagram: `
       +----------+
      /|         /|
     / |   [C]  / |
    +----------+  | [B]
    |  |       |  |
    |  +-------|--+
    | /   [A]  | /
    |/         |/
    +----------+

  Dimension [A] (length): 8 cm
  Dimension [B] (height): 5 cm
  Dimension [C] (width): 3 cm
  Volume = [A] x [B] x [C] = ___ cm^3
  Surface area = 2(___+___+___) = ___ cm^2
`,
    labels: { 'Volume': '120', 'Surface area': '158' },
  },
};

// ===============================================================================
// CER PHENOMENA -- Claim-Evidence-Reasoning writing prompts
// ===============================================================================

const CER_PHENOMENA_LOCAL = {
  'hexagons-in-nature': {
    domain: 'ms-math-geometry',
    title: 'Why Hexagons in Honeycombs?',
    phenomenon: 'Bees build honeycombs using perfectly regular hexagons. Other shapes like squares and triangles can also tile a flat surface without gaps, but bees always choose hexagons.',
    scaffold: {
      claim: 'Make a claim about why hexagons are the most efficient shape for honeycombs.',
      evidence: 'Calculate and compare the area-to-perimeter ratio for a regular triangle, square, and hexagon that all have the same perimeter. What do the numbers show?',
      reasoning: 'Use your calculations and the properties of regular polygons to explain why hexagons maximize storage space while minimizing building material (wax).',
    },
    keyTerms: ['area', 'perimeter', 'regular polygon', 'hexagon', 'efficient', 'tessellation'],
    rubric: {
      claim: { excellent: 'States that hexagons enclose the most area per unit of perimeter among regular tessellating polygons', adequate: 'States hexagons are efficient', developing: 'Vague claim about hexagons' },
      evidence: { excellent: 'Calculates area/perimeter ratios for triangle, square, and hexagon showing hexagons win', adequate: 'Mentions hexagons have more area', developing: 'No calculations provided' },
      reasoning: { excellent: 'Connects polygon properties to optimization: more sides approach a circle (most efficient) and hexagons are the most-sided regular polygon that tessellates', adequate: 'Mentions hexagons are rounder than squares', developing: 'Incomplete reasoning' },
    },
  },
  'bridge-triangles': {
    domain: 'ms-math-geometry',
    title: 'Why Are Bridges Built with Triangles?',
    phenomenon: 'Engineers use triangular trusses in bridges, radio towers, and roof supports. Rectangles and other quadrilaterals are rarely used for structural support, even though they are simpler shapes.',
    scaffold: {
      claim: 'Make a claim about why triangles are preferred over rectangles in structural engineering.',
      evidence: 'Build a triangle and a rectangle from straws and pin joints. Push on the corner of each. What happens?',
      reasoning: 'Use the properties of triangles (triangle inequality, rigidity) to explain why triangles cannot be deformed without changing side lengths.',
    },
    keyTerms: ['triangle', 'rigid', 'stable', 'deform', 'structural', 'triangle inequality'],
    rubric: {
      claim: { excellent: 'States that triangles are the only polygon that is rigid when made from fixed-length sides with hinged joints', adequate: 'States triangles are strong', developing: 'Vague claim' },
      evidence: { excellent: 'Describes that the rectangle collapses into a parallelogram while the triangle maintains its shape', adequate: 'Mentions triangle does not collapse', developing: 'Limited observations' },
      reasoning: { excellent: 'Explains that three fixed side lengths uniquely determine a triangle (by SSS congruence) making it impossible to deform, while quadrilaterals have extra degrees of freedom', adequate: 'Mentions triangles are rigid', developing: 'Incomplete reasoning' },
    },
  },
  'scaling-giants': {
    domain: 'ms-math-geometry',
    title: 'Why Can\'t Giants Exist?',
    phenomenon: 'In movies, giant insects and people are shown walking around normally. But in reality, if you scaled a human to twice their height while keeping the same proportions, they would not be able to walk. Their bones would break under their own weight.',
    scaffold: {
      claim: 'Make a claim about how volume and surface area change when a figure is scaled up.',
      evidence: 'Calculate the surface area and volume of a cube with side 1, then side 2, then side 3. How do the ratios change?',
      reasoning: 'Use the relationship between linear scaling, area scaling (squared), and volume scaling (cubed) to explain why giants would collapse.',
    },
    keyTerms: ['volume', 'surface area', 'scale factor', 'squared', 'cubed', 'ratio'],
    rubric: {
      claim: { excellent: 'States that volume increases as the cube of the scale factor while cross-sectional area (strength) increases only as the square, so larger animals are proportionally weaker', adequate: 'States volume grows faster than surface area', developing: 'Vague claim about size' },
      evidence: { excellent: 'Shows cube calculations: side 1 (SA=6, V=1), side 2 (SA=24, V=8), side 3 (SA=54, V=27) and notes V grows faster', adequate: 'Calculates some values', developing: 'No calculations' },
      reasoning: { excellent: 'Explains square-cube law: bone strength scales with area (k^2) but weight scales with volume (k^3), so at 2x size, bones are 4x stronger but weight is 8x more', adequate: 'Mentions volume grows faster', developing: 'Incomplete connection' },
    },
  },
};

// ===============================================================================
// SCENARIOS -- real-world application scenarios for lessons
// ===============================================================================

const SCENARIOS = [
  { title: 'Designing a Garden', focus: 'area, perimeter, composite shapes', text: 'A family has a rectangular backyard that is 20 m by 15 m. They want to create a garden with a rectangular vegetable section (8 m x 5 m), a circular flower bed (radius 3 m), and stone pathways (1 m wide) between sections. Calculate the area of each section, the total garden area, and the remaining lawn area. How much fencing is needed to border just the vegetable section?' },
  { title: 'Building a Skateboard Ramp', focus: 'triangles, Pythagorean theorem, angle measurement', text: 'A skateboarder wants to build a ramp that is 3 feet tall with a 12-foot horizontal run. Calculate the length of the ramp surface using the Pythagorean theorem. What angle does the ramp make with the ground? If the ramp is 4 feet wide, what is the surface area of the ramp face (the triangle on the side)?' },
  { title: 'Wrapping a Gift Cylinder', focus: 'surface area, circumference, area of circles', text: 'You need to wrap a cylindrical gift that is 20 cm tall with a radius of 8 cm. Calculate the surface area to determine how much wrapping paper you need. If wrapping paper costs $0.05 per cm^2, what is the total cost? What if you only wrap the curved surface and the top (not the bottom)?' },
  { title: 'Mosaic Tile Floor', focus: 'transformations, tessellation, area', text: 'An artist designs a floor mosaic using a basic triangular tile. The tile is reflected, rotated, and translated to create a repeating pattern. Describe the transformations used. If each triangular tile has a base of 10 cm and height of 8 cm, how many tiles are needed to cover a 2 m x 3 m floor? What is the total cost at $1.50 per tile?' },
  { title: 'Pool Volume Problem', focus: 'volume, surface area, unit conversion', text: 'A swimming pool is shaped like a rectangular prism: 25 m long, 10 m wide, and 2 m deep. Calculate the volume in cubic meters and convert to liters (1 m^3 = 1000 L). If the pool is being filled at 500 liters per minute, how long will it take to fill? What is the surface area of the inside of the pool (bottom and four walls)?' },
  { title: 'Map Scale and Distance', focus: 'dilations, similarity, Pythagorean theorem', text: 'A map uses a scale of 1:50,000 (1 cm on the map = 500 m in real life). Two towns are located at map coordinates (3, 1) and (7, 4). Find the straight-line distance between them on the map. Then use the scale factor to find the real-world distance. If a road between them follows a path 6 cm long on the map, what is the actual road distance?' },
];

// ===============================================================================
// VOCABULARY -- key geometry terms per skill category
// ===============================================================================

const VOCABULARY = {
  'angles-lines': [
    { term: 'Angle', definition: 'A figure formed by two rays sharing a common endpoint (vertex).', example: 'The corner of a book forms a 90-degree angle.' },
    { term: 'Acute angle', definition: 'An angle measuring less than 90 degrees.', example: 'A 45-degree angle is acute.' },
    { term: 'Obtuse angle', definition: 'An angle measuring more than 90 degrees but less than 180 degrees.', example: 'A 120-degree angle is obtuse.' },
    { term: 'Right angle', definition: 'An angle measuring exactly 90 degrees.', example: 'The corner of a square is a right angle.' },
    { term: 'Complementary angles', definition: 'Two angles whose measures add up to 90 degrees.', example: '30 degrees and 60 degrees are complementary.' },
    { term: 'Supplementary angles', definition: 'Two angles whose measures add up to 180 degrees.', example: '110 degrees and 70 degrees are supplementary.' },
    { term: 'Vertical angles', definition: 'Pairs of opposite angles formed when two lines intersect; always congruent.', example: 'When two lines cross, the angles across from each other are equal.' },
    { term: 'Transversal', definition: 'A line that intersects two or more other lines.', example: 'A road crossing railroad tracks is a transversal.' },
    { term: 'Corresponding angles', definition: 'Angles in the same position at each intersection when a transversal crosses parallel lines; congruent.', example: 'Top-left angles at both intersections are corresponding.' },
    { term: 'Alternate interior angles', definition: 'Angles on opposite sides of the transversal between the parallel lines; congruent.', example: 'The Z-pattern angles in parallel lines cut by a transversal.' },
  ],
  'triangles': [
    { term: 'Triangle', definition: 'A polygon with three sides and three angles.', example: 'A yield sign is shaped like a triangle.' },
    { term: 'Equilateral triangle', definition: 'A triangle with all three sides equal and all angles 60 degrees.', example: 'A triangle with sides 5, 5, 5 is equilateral.' },
    { term: 'Isosceles triangle', definition: 'A triangle with at least two sides of equal length.', example: 'A triangle with sides 5, 5, 8 is isosceles.' },
    { term: 'Scalene triangle', definition: 'A triangle with no equal sides.', example: 'A triangle with sides 3, 4, 6 is scalene.' },
    { term: 'Hypotenuse', definition: 'The longest side of a right triangle, opposite the right angle.', example: 'In a 3-4-5 triangle, 5 is the hypotenuse.' },
    { term: 'Pythagorean theorem', definition: 'In a right triangle, a^2 + b^2 = c^2, where c is the hypotenuse.', example: '3^2 + 4^2 = 9 + 16 = 25 = 5^2.' },
    { term: 'Pythagorean triple', definition: 'Three whole numbers that satisfy a^2 + b^2 = c^2.', example: '3-4-5, 5-12-13, and 8-15-17 are Pythagorean triples.' },
    { term: 'Triangle inequality', definition: 'The sum of any two sides must be greater than the third side.', example: 'Sides 2, 3, 6 cannot form a triangle because 2 + 3 < 6.' },
  ],
  'polygons-circles': [
    { term: 'Polygon', definition: 'A closed two-dimensional shape with straight sides.', example: 'Triangles, rectangles, and hexagons are all polygons.' },
    { term: 'Regular polygon', definition: 'A polygon with all sides and all angles equal.', example: 'A regular hexagon has six equal sides and six 120-degree angles.' },
    { term: 'Parallelogram', definition: 'A quadrilateral with two pairs of parallel sides.', example: 'A rectangle and a rhombus are both parallelograms.' },
    { term: 'Circumference', definition: 'The distance around a circle; C = 2*pi*r or pi*d.', example: 'A circle with radius 7 has circumference about 44 units.' },
    { term: 'Area', definition: 'The amount of space inside a two-dimensional figure, measured in square units.', example: 'A rectangle 5 x 3 has area 15 square units.' },
    { term: 'Pi (pi)', definition: 'The ratio of a circle\'s circumference to its diameter; approximately 3.14159.', example: 'pi is the same for every circle regardless of size.' },
    { term: 'Radius', definition: 'The distance from the center of a circle to any point on the circle.', example: 'If the diameter is 10, the radius is 5.' },
    { term: 'Diameter', definition: 'The distance across a circle through its center; twice the radius.', example: 'A circle with radius 4 has diameter 8.' },
    { term: 'Composite shape', definition: 'A shape made up of two or more simpler shapes.', example: 'An L-shape can be split into two rectangles.' },
  ],
  'volume-surface-area': [
    { term: 'Volume', definition: 'The amount of space inside a three-dimensional figure, measured in cubic units.', example: 'A cube with edge 3 has volume 27 cm^3.' },
    { term: 'Surface area', definition: 'The total area of all faces of a three-dimensional figure.', example: 'A cube with edge 3 has surface area 54 cm^2.' },
    { term: 'Prism', definition: 'A 3D figure with two identical parallel bases and rectangular lateral faces.', example: 'A cereal box is a rectangular prism.' },
    { term: 'Cylinder', definition: 'A 3D figure with two parallel circular bases connected by a curved surface.', example: 'A soup can is a cylinder.' },
    { term: 'Cone', definition: 'A 3D figure with a circular base and a pointed top (apex).', example: 'An ice cream cone is shaped like a cone.' },
    { term: 'Sphere', definition: 'A perfectly round 3D figure where every point on the surface is the same distance from the center.', example: 'A basketball is a sphere.' },
    { term: 'Net', definition: 'A flat pattern that can be folded to form a 3D figure.', example: 'The net of a cube is six connected squares.' },
  ],
  'transformations': [
    { term: 'Transformation', definition: 'A rule that moves or changes a figure in some way.', example: 'Sliding, flipping, turning, and resizing are all transformations.' },
    { term: 'Translation', definition: 'A slide that moves every point of a figure the same distance in the same direction.', example: 'Moving a chess piece straight forward is a translation.' },
    { term: 'Reflection', definition: 'A flip that creates a mirror image of a figure across a line.', example: 'Your reflection in a mirror is a geometric reflection.' },
    { term: 'Rotation', definition: 'A turn of a figure around a fixed point by a certain angle.', example: 'A clock hand rotates around the center of the clock.' },
    { term: 'Dilation', definition: 'A transformation that changes the size of a figure by a scale factor while keeping its shape.', example: 'Zooming in on a photo is like a dilation.' },
    { term: 'Congruent', definition: 'Two figures that have the same shape and size.', example: 'Two identical puzzle pieces are congruent.' },
    { term: 'Similar', definition: 'Two figures that have the same shape but not necessarily the same size.', example: 'A photo and its enlargement are similar figures.' },
    { term: 'Scale factor', definition: 'The ratio of corresponding side lengths in similar figures.', example: 'If a triangle is enlarged by scale factor 3, all sides are tripled.' },
    { term: 'Rigid motion', definition: 'A transformation that preserves distance and angle measure (translation, reflection, rotation).', example: 'Rigid motions produce congruent figures.' },
  ],
};

// ===============================================================================
// Exercise generation helper
// ===============================================================================

function generateExercise(skill, count = 5, mastery = null, seenQ = null) {
  return _generateExercise({ bank: QUESTION_BANKS[skill], skill, count, mastery, seenQ, type: 'exercise', instruction: 'Answer each question.' });
}

// ===============================================================================
// CLASS -- extends DomainSkillBase
// ===============================================================================

class MSMathGeometry extends DomainSkillBase {
  constructor() {
    super('ms-math-geometry', 'ms-math-geometry', DATA_DIR, loadProfile, saveProfile, HINT_BANKS);
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
        if (m < MASTERY_THRESHOLD && _geometryTopicUnlocked(sk, p.skills)) {
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
        const isUnlocked = _geometryTopicUnlocked(sk, p.skills);
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
    if (!target) return { message: 'All geometry skills are proficient!', congratulations: true };
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
        apply: scenario ? `Analyze scenario: "${scenario.title}"` : 'Connect to real-world geometry applications',
        extend: `Connect ${target.skill} to related geometry concepts`,
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
    if (!name) return { labs: Object.keys(VIRTUAL_LABS), instructions: 'node geometry.js lab <id> <lab-name> [obs-key]' };
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

  // Override base class to use local geometry diagrams
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
      message: due.length === 0 ? 'No geometry skills due for review today!' : `${due.length} skill(s) need review. Work through each exercise below.`,
    };
  }
}

module.exports = MSMathGeometry;

// ===============================================================================
// CLI: node geometry.js <command> [args]
// ===============================================================================

if (require.main === module) {
  const api = new MSMathGeometry();
  const common = buildCommonCLIHandlers(api, DATA_DIR, 'ms-math-geometry', loadProfile, saveProfile);
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
        try { ans = JSON.parse(answersJson); } catch { throw new Error("answers-json must be valid JSON e.g. '{\"A\":\"right\"}'"); }
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
        skill: 'ms-math-geometry',
        gradeLevel: '6-8',
        standards: 'CCSS Geometry & Measurement',
        usage: 'node geometry.js <command> [args]',
        commands: {
          'start <id>': 'Start a student session; includes last session state for resume prompt',
          'resume <id>': 'Resume last session or offer to start fresh if >24h old',
          'lesson <id>': 'Generate a lesson with concept explanation and exercises',
          'exercise <id> [skill]': 'Generate 5 practice items; optionally filter by skill',
          'check <id> <type> <expected> <answer> [skill]': 'Check an answer; returns misconception feedback if wrong',
          'record <id> <skill> <score> <total> [hints] [notes]': 'Save a scored assessment attempt',
          'progress <id>': 'Show mastery levels across all geometry skills',
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
          'vocab <id> [topic]': 'Pre-teach geometry vocabulary',
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
        usage: 'node geometry.js <command> [args]',
        commands: ['start', 'resume', 'lesson', 'exercise', 'check', 'record', 'progress', 'report', 'next', 'catalog', 'students', 'review', 'hint', 'hint-reset', 'lab', 'diagram', 'diagram-check', 'cer', 'cer-check', 'cer-history', 'vocab', 'phenomenon', 'scenario', 'profile', 'standards', 'socratic', 'socratic-record', 'suggest-next', 'progression', 'help'],
      });
    }
  });
}
