import { Orca } from '@/components/orca/orca';
import { View } from '@/components/ui/view';
import { Whisper } from '@/components/whisper/whisper';

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
    {
      order: 11,
      text: 'Guten Abend, Frau Schmidt',
      dictionary: [
        { language: 'en', text: 'Good evening, Mrs. Schmidt' },
        { language: 'ar', text: 'مساء الخير يا سيدة شميت' },
      ],
    },
    {
      order: 12,
      text: 'Hallo, wie geht es?',
      dictionary: [
        { language: 'en', text: 'Hello, how are you?' },
        { language: 'ar', text: 'مرحباً، كيف حالك؟' },
      ],
    },
    {
      order: 13,
      text: 'Tschüss, bis morgen',
      dictionary: [
        { language: 'en', text: 'Bye, see you tomorrow' },
        { language: 'ar', text: 'وداعاً، أراك غداً' },
      ],
    },
    {
      order: 14,
      text: 'Gute Nacht, Maria',
      dictionary: [
        { language: 'en', text: 'Good night, Maria' },
        { language: 'ar', text: 'تصبحين على خير يا ماريا' },
      ],
    },
    {
      order: 15,
      text: 'Auf Wiedersehen, Herr Klein',
      dictionary: [
        { language: 'en', text: 'Goodbye, Mr. Klein' },
        { language: 'ar', text: 'إلى اللقاء يا سيد كلاين' },
      ],
    },
  ],
};

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Orca />
    </View>
  );
}
