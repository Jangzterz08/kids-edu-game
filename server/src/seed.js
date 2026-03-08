require('dotenv').config();
const prisma = require('./lib/db');

const MODULES = [
  {
    slug: 'alphabet', title: 'Alphabet', iconEmoji: '🔤', sortOrder: 1,
    lessons: [
      { slug: 'letter-a', title: 'A is for Apple', word: 'Apple', imageFile: 'alphabet/apple.webp', audioFile: 'alphabet/apple.mp3', sortOrder: 1 },
      { slug: 'letter-b', title: 'B is for Ball', word: 'Ball', imageFile: 'alphabet/ball.webp', audioFile: 'alphabet/ball.mp3', sortOrder: 2 },
      { slug: 'letter-c', title: 'C is for Cat', word: 'Cat', imageFile: 'alphabet/cat.webp', audioFile: 'alphabet/cat.mp3', sortOrder: 3 },
      { slug: 'letter-d', title: 'D is for Dog', word: 'Dog', imageFile: 'alphabet/dog.webp', audioFile: 'alphabet/dog.mp3', sortOrder: 4 },
      { slug: 'letter-e', title: 'E is for Elephant', word: 'Elephant', imageFile: 'alphabet/elephant.webp', audioFile: 'alphabet/elephant.mp3', sortOrder: 5 },
      { slug: 'letter-f', title: 'F is for Fish', word: 'Fish', imageFile: 'alphabet/fish.webp', audioFile: 'alphabet/fish.mp3', sortOrder: 6 },
      { slug: 'letter-g', title: 'G is for Grapes', word: 'Grapes', imageFile: 'alphabet/grapes.webp', audioFile: 'alphabet/grapes.mp3', sortOrder: 7 },
      { slug: 'letter-h', title: 'H is for House', word: 'House', imageFile: 'alphabet/house.webp', audioFile: 'alphabet/house.mp3', sortOrder: 8 },
      { slug: 'letter-i', title: 'I is for Ice Cream', word: 'Ice Cream', imageFile: 'alphabet/icecream.webp', audioFile: 'alphabet/icecream.mp3', sortOrder: 9 },
      { slug: 'letter-j', title: 'J is for Jar', word: 'Jar', imageFile: 'alphabet/jar.webp', audioFile: 'alphabet/jar.mp3', sortOrder: 10 },
      { slug: 'letter-k', title: 'K is for Kite', word: 'Kite', imageFile: 'alphabet/kite.webp', audioFile: 'alphabet/kite.mp3', sortOrder: 11 },
      { slug: 'letter-l', title: 'L is for Lion', word: 'Lion', imageFile: 'alphabet/lion.webp', audioFile: 'alphabet/lion.mp3', sortOrder: 12 },
      { slug: 'letter-m', title: 'M is for Moon', word: 'Moon', imageFile: 'alphabet/moon.webp', audioFile: 'alphabet/moon.mp3', sortOrder: 13 },
      { slug: 'letter-n', title: 'N is for Nest', word: 'Nest', imageFile: 'alphabet/nest.webp', audioFile: 'alphabet/nest.mp3', sortOrder: 14 },
      { slug: 'letter-o', title: 'O is for Orange', word: 'Orange', imageFile: 'alphabet/orange.webp', audioFile: 'alphabet/orange.mp3', sortOrder: 15 },
      { slug: 'letter-p', title: 'P is for Penguin', word: 'Penguin', imageFile: 'alphabet/penguin.webp', audioFile: 'alphabet/penguin.mp3', sortOrder: 16 },
      { slug: 'letter-q', title: 'Q is for Queen', word: 'Queen', imageFile: 'alphabet/queen.webp', audioFile: 'alphabet/queen.mp3', sortOrder: 17 },
      { slug: 'letter-r', title: 'R is for Rainbow', word: 'Rainbow', imageFile: 'alphabet/rainbow.webp', audioFile: 'alphabet/rainbow.mp3', sortOrder: 18 },
      { slug: 'letter-s', title: 'S is for Sun', word: 'Sun', imageFile: 'alphabet/sun.webp', audioFile: 'alphabet/sun.mp3', sortOrder: 19 },
      { slug: 'letter-t', title: 'T is for Tiger', word: 'Tiger', imageFile: 'alphabet/tiger.webp', audioFile: 'alphabet/tiger.mp3', sortOrder: 20 },
      { slug: 'letter-u', title: 'U is for Umbrella', word: 'Umbrella', imageFile: 'alphabet/umbrella.webp', audioFile: 'alphabet/umbrella.mp3', sortOrder: 21 },
      { slug: 'letter-v', title: 'V is for Violin', word: 'Violin', imageFile: 'alphabet/violin.webp', audioFile: 'alphabet/violin.mp3', sortOrder: 22 },
      { slug: 'letter-w', title: 'W is for Whale', word: 'Whale', imageFile: 'alphabet/whale.webp', audioFile: 'alphabet/whale.mp3', sortOrder: 23 },
      { slug: 'letter-x', title: 'X is for Xylophone', word: 'Xylophone', imageFile: 'alphabet/xylophone.webp', audioFile: 'alphabet/xylophone.mp3', sortOrder: 24 },
      { slug: 'letter-y', title: 'Y is for Yak', word: 'Yak', imageFile: 'alphabet/yak.webp', audioFile: 'alphabet/yak.mp3', sortOrder: 25 },
      { slug: 'letter-z', title: 'Z is for Zebra', word: 'Zebra', imageFile: 'alphabet/zebra.webp', audioFile: 'alphabet/zebra.mp3', sortOrder: 26 },
    ],
  },
  {
    slug: 'numbers', title: 'Numbers', iconEmoji: '🔢', sortOrder: 2,
    lessons: [
      { slug: 'number-0', title: 'Zero', word: 'Zero', imageFile: 'numbers/zero.webp', audioFile: 'numbers/zero.mp3', sortOrder: 1 },
      { slug: 'number-1', title: 'One', word: 'One', imageFile: 'numbers/one.webp', audioFile: 'numbers/one.mp3', sortOrder: 2 },
      { slug: 'number-2', title: 'Two', word: 'Two', imageFile: 'numbers/two.webp', audioFile: 'numbers/two.mp3', sortOrder: 3 },
      { slug: 'number-3', title: 'Three', word: 'Three', imageFile: 'numbers/three.webp', audioFile: 'numbers/three.mp3', sortOrder: 4 },
      { slug: 'number-4', title: 'Four', word: 'Four', imageFile: 'numbers/four.webp', audioFile: 'numbers/four.mp3', sortOrder: 5 },
      { slug: 'number-5', title: 'Five', word: 'Five', imageFile: 'numbers/five.webp', audioFile: 'numbers/five.mp3', sortOrder: 6 },
      { slug: 'number-6', title: 'Six', word: 'Six', imageFile: 'numbers/six.webp', audioFile: 'numbers/six.mp3', sortOrder: 7 },
      { slug: 'number-7', title: 'Seven', word: 'Seven', imageFile: 'numbers/seven.webp', audioFile: 'numbers/seven.mp3', sortOrder: 8 },
      { slug: 'number-8', title: 'Eight', word: 'Eight', imageFile: 'numbers/eight.webp', audioFile: 'numbers/eight.mp3', sortOrder: 9 },
      { slug: 'number-9', title: 'Nine', word: 'Nine', imageFile: 'numbers/nine.webp', audioFile: 'numbers/nine.mp3', sortOrder: 10 },
    ],
  },
  {
    slug: 'shapes', title: 'Shapes', iconEmoji: '🔷', sortOrder: 3,
    lessons: [
      { slug: 'circle', title: 'Circle', word: 'Circle', imageFile: 'shapes/circle.webp', audioFile: 'shapes/circle.mp3', sortOrder: 1 },
      { slug: 'square', title: 'Square', word: 'Square', imageFile: 'shapes/square.webp', audioFile: 'shapes/square.mp3', sortOrder: 2 },
      { slug: 'triangle', title: 'Triangle', word: 'Triangle', imageFile: 'shapes/triangle.webp', audioFile: 'shapes/triangle.mp3', sortOrder: 3 },
      { slug: 'rectangle', title: 'Rectangle', word: 'Rectangle', imageFile: 'shapes/rectangle.webp', audioFile: 'shapes/rectangle.mp3', sortOrder: 4 },
      { slug: 'star', title: 'Star', word: 'Star', imageFile: 'shapes/star.webp', audioFile: 'shapes/star.mp3', sortOrder: 5 },
      { slug: 'heart', title: 'Heart', word: 'Heart', imageFile: 'shapes/heart.webp', audioFile: 'shapes/heart.mp3', sortOrder: 6 },
      { slug: 'diamond', title: 'Diamond', word: 'Diamond', imageFile: 'shapes/diamond.webp', audioFile: 'shapes/diamond.mp3', sortOrder: 7 },
      { slug: 'oval', title: 'Oval', word: 'Oval', imageFile: 'shapes/oval.webp', audioFile: 'shapes/oval.mp3', sortOrder: 8 },
    ],
  },
  {
    slug: 'colors', title: 'Colors', iconEmoji: '🎨', sortOrder: 4,
    lessons: [
      { slug: 'color-red', title: 'Red', word: 'Red', imageFile: 'colors/red.webp', audioFile: 'colors/red.mp3', sortOrder: 1 },
      { slug: 'color-blue', title: 'Blue', word: 'Blue', imageFile: 'colors/blue.webp', audioFile: 'colors/blue.mp3', sortOrder: 2 },
      { slug: 'color-yellow', title: 'Yellow', word: 'Yellow', imageFile: 'colors/yellow.webp', audioFile: 'colors/yellow.mp3', sortOrder: 3 },
      { slug: 'color-green', title: 'Green', word: 'Green', imageFile: 'colors/green.webp', audioFile: 'colors/green.mp3', sortOrder: 4 },
      { slug: 'color-orange', title: 'Orange', word: 'Orange', imageFile: 'colors/orange.webp', audioFile: 'colors/orange.mp3', sortOrder: 5 },
      { slug: 'color-purple', title: 'Purple', word: 'Purple', imageFile: 'colors/purple.webp', audioFile: 'colors/purple.mp3', sortOrder: 6 },
      { slug: 'color-pink', title: 'Pink', word: 'Pink', imageFile: 'colors/pink.webp', audioFile: 'colors/pink.mp3', sortOrder: 7 },
      { slug: 'color-brown', title: 'Brown', word: 'Brown', imageFile: 'colors/brown.webp', audioFile: 'colors/brown.mp3', sortOrder: 8 },
      { slug: 'color-black', title: 'Black', word: 'Black', imageFile: 'colors/black.webp', audioFile: 'colors/black.mp3', sortOrder: 9 },
      { slug: 'color-white', title: 'White', word: 'White', imageFile: 'colors/white.webp', audioFile: 'colors/white.mp3', sortOrder: 10 },
    ],
  },
  {
    slug: 'animals', title: 'Animals', iconEmoji: '🐾', sortOrder: 5,
    lessons: [
      { slug: 'dog', title: 'Dog', word: 'Dog', imageFile: 'animals/dog.webp', audioFile: 'animals/dog.mp3', sortOrder: 1 },
      { slug: 'cat', title: 'Cat', word: 'Cat', imageFile: 'animals/cat.webp', audioFile: 'animals/cat.mp3', sortOrder: 2 },
      { slug: 'cow', title: 'Cow', word: 'Cow', imageFile: 'animals/cow.webp', audioFile: 'animals/cow.mp3', sortOrder: 3 },
      { slug: 'elephant', title: 'Elephant', word: 'Elephant', imageFile: 'animals/elephant.webp', audioFile: 'animals/elephant.mp3', sortOrder: 4 },
      { slug: 'lion', title: 'Lion', word: 'Lion', imageFile: 'animals/lion.webp', audioFile: 'animals/lion.mp3', sortOrder: 5 },
      { slug: 'monkey', title: 'Monkey', word: 'Monkey', imageFile: 'animals/monkey.webp', audioFile: 'animals/monkey.mp3', sortOrder: 6 },
      { slug: 'rabbit', title: 'Rabbit', word: 'Rabbit', imageFile: 'animals/rabbit.webp', audioFile: 'animals/rabbit.mp3', sortOrder: 7 },
      { slug: 'duck', title: 'Duck', word: 'Duck', imageFile: 'animals/duck.webp', audioFile: 'animals/duck.mp3', sortOrder: 8 },
      { slug: 'fish', title: 'Fish', word: 'Fish', imageFile: 'animals/fish.webp', audioFile: 'animals/fish.mp3', sortOrder: 9 },
      { slug: 'bird', title: 'Bird', word: 'Bird', imageFile: 'animals/bird.webp', audioFile: 'animals/bird.mp3', sortOrder: 10 },
    ],
  },
  {
    slug: 'body-parts', title: 'Body Parts', iconEmoji: '🫀', sortOrder: 6,
    lessons: [
      { slug: 'head', title: 'Head', word: 'Head', imageFile: 'body/head.webp', audioFile: 'body/head.mp3', sortOrder: 1 },
      { slug: 'eyes', title: 'Eyes', word: 'Eyes', imageFile: 'body/eyes.webp', audioFile: 'body/eyes.mp3', sortOrder: 2 },
      { slug: 'ears', title: 'Ears', word: 'Ears', imageFile: 'body/ears.webp', audioFile: 'body/ears.mp3', sortOrder: 3 },
      { slug: 'nose', title: 'Nose', word: 'Nose', imageFile: 'body/nose.webp', audioFile: 'body/nose.mp3', sortOrder: 4 },
      { slug: 'mouth', title: 'Mouth', word: 'Mouth', imageFile: 'body/mouth.webp', audioFile: 'body/mouth.mp3', sortOrder: 5 },
      { slug: 'hands', title: 'Hands', word: 'Hands', imageFile: 'body/hands.webp', audioFile: 'body/hands.mp3', sortOrder: 6 },
      { slug: 'feet', title: 'Feet', word: 'Feet', imageFile: 'body/feet.webp', audioFile: 'body/feet.mp3', sortOrder: 7 },
      { slug: 'belly', title: 'Belly', word: 'Belly', imageFile: 'body/belly.webp', audioFile: 'body/belly.mp3', sortOrder: 8 },
    ],
  },
  {
    slug: 'manners', title: 'Good Manners', iconEmoji: '🤝', sortOrder: 7,
    lessons: [
      { slug: 'please', title: 'Please', word: 'Please', imageFile: 'manners/please.webp', audioFile: 'manners/please.mp3', sortOrder: 1 },
      { slug: 'thank-you', title: 'Thank You', word: 'Thank You', imageFile: 'manners/thankyou.webp', audioFile: 'manners/thankyou.mp3', sortOrder: 2 },
      { slug: 'sorry', title: 'Sorry', word: 'Sorry', imageFile: 'manners/sorry.webp', audioFile: 'manners/sorry.mp3', sortOrder: 3 },
      { slug: 'share', title: 'Share', word: 'Share', imageFile: 'manners/share.webp', audioFile: 'manners/share.mp3', sortOrder: 4 },
      { slug: 'listen', title: 'Listen', word: 'Listen', imageFile: 'manners/listen.webp', audioFile: 'manners/listen.mp3', sortOrder: 5 },
      { slug: 'help', title: 'Help', word: 'Help', imageFile: 'manners/help.webp', audioFile: 'manners/help.mp3', sortOrder: 6 },
      { slug: 'greet', title: 'Say Hello', word: 'Hello', imageFile: 'manners/hello.webp', audioFile: 'manners/hello.mp3', sortOrder: 7 },
    ],
  },
  {
    slug: 'household', title: 'Around the House', iconEmoji: '🏠', sortOrder: 8,
    lessons: [
      { slug: 'chair', title: 'Chair', word: 'Chair', imageFile: 'household/chair.webp', audioFile: 'household/chair.mp3', sortOrder: 1 },
      { slug: 'table', title: 'Table', word: 'Table', imageFile: 'household/table.webp', audioFile: 'household/table.mp3', sortOrder: 2 },
      { slug: 'bed', title: 'Bed', word: 'Bed', imageFile: 'household/bed.webp', audioFile: 'household/bed.mp3', sortOrder: 3 },
      { slug: 'door', title: 'Door', word: 'Door', imageFile: 'household/door.webp', audioFile: 'household/door.mp3', sortOrder: 4 },
      { slug: 'window', title: 'Window', word: 'Window', imageFile: 'household/window.webp', audioFile: 'household/window.mp3', sortOrder: 5 },
      { slug: 'lamp', title: 'Lamp', word: 'Lamp', imageFile: 'household/lamp.webp', audioFile: 'household/lamp.mp3', sortOrder: 6 },
      { slug: 'sofa', title: 'Sofa', word: 'Sofa', imageFile: 'household/sofa.webp', audioFile: 'household/sofa.mp3', sortOrder: 7 },
      { slug: 'fridge', title: 'Fridge', word: 'Fridge', imageFile: 'household/fridge.webp', audioFile: 'household/fridge.mp3', sortOrder: 8 },
    ],
  },
  {
    slug: 'food-pyramid', title: 'Food Pyramid', iconEmoji: '🥗', sortOrder: 9,
    lessons: [
      { slug: 'grains', title: 'Grains', word: 'Grains', imageFile: 'food/grains.webp', audioFile: 'food/grains.mp3', sortOrder: 1 },
      { slug: 'vegetables', title: 'Vegetables', word: 'Vegetables', imageFile: 'food/vegetables.webp', audioFile: 'food/vegetables.mp3', sortOrder: 2 },
      { slug: 'fruits', title: 'Fruits', word: 'Fruits', imageFile: 'food/fruits.webp', audioFile: 'food/fruits.mp3', sortOrder: 3 },
      { slug: 'dairy', title: 'Dairy', word: 'Dairy', imageFile: 'food/dairy.webp', audioFile: 'food/dairy.mp3', sortOrder: 4 },
      { slug: 'protein', title: 'Protein', word: 'Protein', imageFile: 'food/protein.webp', audioFile: 'food/protein.mp3', sortOrder: 5 },
      { slug: 'water', title: 'Water', word: 'Water', imageFile: 'food/water.webp', audioFile: 'food/water.mp3', sortOrder: 6 },
      { slug: 'sweets', title: 'Sweets', word: 'Sweets', imageFile: 'food/sweets.webp', audioFile: 'food/sweets.mp3', sortOrder: 7 },
    ],
  },
  {
    slug: 'emotions', title: 'Emotions', iconEmoji: '😊', sortOrder: 10,
    lessons: [
      { slug: 'happy',     title: 'Happy',     word: 'Happy',     imageFile: 'emotions/happy.webp',     audioFile: 'emotions/happy.mp3',     sortOrder: 1 },
      { slug: 'sad',       title: 'Sad',       word: 'Sad',       imageFile: 'emotions/sad.webp',       audioFile: 'emotions/sad.mp3',       sortOrder: 2 },
      { slug: 'angry',     title: 'Angry',     word: 'Angry',     imageFile: 'emotions/angry.webp',     audioFile: 'emotions/angry.mp3',     sortOrder: 3 },
      { slug: 'scared',    title: 'Scared',    word: 'Scared',    imageFile: 'emotions/scared.webp',    audioFile: 'emotions/scared.mp3',    sortOrder: 4 },
      { slug: 'surprised', title: 'Surprised', word: 'Surprised', imageFile: 'emotions/surprised.webp', audioFile: 'emotions/surprised.mp3', sortOrder: 5 },
      { slug: 'excited',   title: 'Excited',   word: 'Excited',   imageFile: 'emotions/excited.webp',   audioFile: 'emotions/excited.mp3',   sortOrder: 6 },
      { slug: 'tired',     title: 'Tired',     word: 'Tired',     imageFile: 'emotions/tired.webp',     audioFile: 'emotions/tired.mp3',     sortOrder: 7 },
      { slug: 'silly',     title: 'Silly',     word: 'Silly',     imageFile: 'emotions/silly.webp',     audioFile: 'emotions/silly.mp3',     sortOrder: 8 },
    ],
  },
  {
    slug: 'weather', title: 'Weather', iconEmoji: '⛅', sortOrder: 11,
    lessons: [
      { slug: 'sunny',   title: 'Sunny',   word: 'Sunny',   imageFile: 'weather/sunny.webp',   audioFile: 'weather/sunny.mp3',   sortOrder: 1 },
      { slug: 'rainy',   title: 'Rainy',   word: 'Rainy',   imageFile: 'weather/rainy.webp',   audioFile: 'weather/rainy.mp3',   sortOrder: 2 },
      { slug: 'cloudy',  title: 'Cloudy',  word: 'Cloudy',  imageFile: 'weather/cloudy.webp',  audioFile: 'weather/cloudy.mp3',  sortOrder: 3 },
      { slug: 'snowy',   title: 'Snowy',   word: 'Snowy',   imageFile: 'weather/snowy.webp',   audioFile: 'weather/snowy.mp3',   sortOrder: 4 },
      { slug: 'windy',   title: 'Windy',   word: 'Windy',   imageFile: 'weather/windy.webp',   audioFile: 'weather/windy.mp3',   sortOrder: 5 },
      { slug: 'stormy',  title: 'Stormy',  word: 'Stormy',  imageFile: 'weather/stormy.webp',  audioFile: 'weather/stormy.mp3',  sortOrder: 6 },
      { slug: 'rainbow', title: 'Rainbow', word: 'Rainbow', imageFile: 'weather/rainbow.webp', audioFile: 'weather/rainbow.mp3', sortOrder: 7 },
      { slug: 'foggy',   title: 'Foggy',   word: 'Foggy',   imageFile: 'weather/foggy.webp',   audioFile: 'weather/foggy.mp3',   sortOrder: 8 },
    ],
  },
  {
    slug: 'days-of-week', title: 'Days of the Week', iconEmoji: '📅', sortOrder: 12,
    lessons: [
      { slug: 'monday',    title: 'Monday',    word: 'Monday',    imageFile: 'days/monday.webp',    audioFile: 'days/monday.mp3',    sortOrder: 1 },
      { slug: 'tuesday',   title: 'Tuesday',   word: 'Tuesday',   imageFile: 'days/tuesday.webp',   audioFile: 'days/tuesday.mp3',   sortOrder: 2 },
      { slug: 'wednesday', title: 'Wednesday', word: 'Wednesday', imageFile: 'days/wednesday.webp', audioFile: 'days/wednesday.mp3', sortOrder: 3 },
      { slug: 'thursday',  title: 'Thursday',  word: 'Thursday',  imageFile: 'days/thursday.webp',  audioFile: 'days/thursday.mp3',  sortOrder: 4 },
      { slug: 'friday',    title: 'Friday',    word: 'Friday',    imageFile: 'days/friday.webp',    audioFile: 'days/friday.mp3',    sortOrder: 5 },
      { slug: 'saturday',  title: 'Saturday',  word: 'Saturday',  imageFile: 'days/saturday.webp',  audioFile: 'days/saturday.mp3',  sortOrder: 6 },
      { slug: 'sunday',    title: 'Sunday',    word: 'Sunday',    imageFile: 'days/sunday.webp',    audioFile: 'days/sunday.mp3',    sortOrder: 7 },
    ],
  },
];

async function main() {
  console.log('Seeding modules and lessons...');
  for (const mod of MODULES) {
    const { lessons, ...moduleData } = mod;
    const module = await prisma.module.upsert({
      where: { slug: moduleData.slug },
      create: moduleData,
      update: { title: moduleData.title, iconEmoji: moduleData.iconEmoji, sortOrder: moduleData.sortOrder },
    });

    for (const lesson of lessons) {
      await prisma.lesson.upsert({
        where: { moduleId_slug: { moduleId: module.id, slug: lesson.slug } },
        create: { ...lesson, moduleId: module.id },
        update: { title: lesson.title, word: lesson.word, imageFile: lesson.imageFile, audioFile: lesson.audioFile, sortOrder: lesson.sortOrder },
      });
    }
    console.log(`  Seeded: ${moduleData.slug} (${lessons.length} lessons)`);
  }
  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
