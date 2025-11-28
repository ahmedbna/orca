import { Orca } from '@/components/orca/orca';

const LEARNING_LANGUAGE = 'de';
const NATIVE_LANGUAGE = 'en';

const LESSON = {
  order: 1,
  title: 'Begrüßungen',
  phrases: [
    {
      order: 1,
      text: 'Hallo!',
      dictionary: [
        { language: 'en', text: 'Hello!' },
        { language: 'ar', text: 'مرحباً!' },
      ],
    },
    {
      order: 2,
      text: 'Guten Morgen',
      dictionary: [
        { language: 'en', text: 'Good morning' },
        { language: 'ar', text: 'صباح الخير' },
      ],
    },
    {
      order: 3,
      text: 'Guten Tag',
      dictionary: [
        { language: 'en', text: 'Good day' },
        { language: 'ar', text: 'نهارك سعيد' },
      ],
    },
    {
      order: 4,
      text: 'Guten Abend',
      dictionary: [
        { language: 'en', text: 'Good evening' },
        { language: 'ar', text: 'مساء الخير' },
      ],
    },
    {
      order: 5,
      text: 'Gute Nacht',
      dictionary: [
        { language: 'en', text: 'Good night' },
        { language: 'ar', text: 'تصبح على خير' },
      ],
    },
    {
      order: 6,
      text: 'Tschüss',
      dictionary: [
        { language: 'en', text: 'Bye' },
        { language: 'ar', text: 'وداعاً' },
      ],
    },
    {
      order: 7,
      text: 'Auf Wiedersehen',
      dictionary: [
        { language: 'en', text: 'Goodbye' },
        { language: 'ar', text: 'إلى اللقاء' },
      ],
    },
    {
      order: 8,
      text: 'Bis bald',
      dictionary: [
        { language: 'en', text: 'See you soon' },
        { language: 'ar', text: 'أراك قريباً' },
      ],
    },
    {
      order: 9,
      text: 'Hallo, ich bin Anna',
      dictionary: [
        { language: 'en', text: 'Hello, I am Anna' },
        { language: 'ar', text: 'مرحباً، أنا آنا' },
      ],
    },
    {
      order: 10,
      text: 'Guten Tag, Herr Müller',
      dictionary: [
        { language: 'en', text: 'Good day, Mr. Müller' },
        { language: 'ar', text: 'نهارك سعيد يا سيد مولر' },
      ],
    },
  ],
};

export default function HomeScreen() {
  return (
    <Orca
      lesson={LESSON}
      native={NATIVE_LANGUAGE}
      language={LEARNING_LANGUAGE}
    />
  );
}
