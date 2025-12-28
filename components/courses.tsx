import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function CoursesScreen() {
  const courses = useQuery(api.courses.getAll);

  if (courses === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner size='lg' variant='circle' color='#000000' />
      </View>
    );
  }

  if (courses === null || courses.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <Text variant='heading' style={{ marginBottom: 8 }}>
          No Courses Available
        </Text>
        <Text style={{ textAlign: 'center', opacity: 0.7 }}>
          Please select a learning language to view available courses.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle={{
        padding: 16,
        paddingTop: 40,
        paddingBottom: 100,
      }}
    >
      <Text variant='heading' style={{ marginBottom: 8 }}>
        Your Courses
      </Text>
      <Text style={{ marginBottom: 24, opacity: 0.7 }}>
        Continue your learning journey
      </Text>

      {courses.map((course) => (
        <Card
          key={course._id}
          style={{
            marginBottom: 16,
            padding: 16,
            opacity: course.isUnlocked ? 1 : 0.5,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant='title' style={{ marginBottom: 4 }}>
                {course.title}
              </Text>
              <Text style={{ opacity: 0.7, fontSize: 14 }}>
                {course.description}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
              {course.isCurrent && (
                <Text style={{ fontSize: 12 }}>Current</Text>
              )}
              {course.isCompleted && <Text style={{ fontSize: 12 }}>✓</Text>}
              {!course.isUnlocked && <Text style={{ fontSize: 12 }}>🔒</Text>}
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}
