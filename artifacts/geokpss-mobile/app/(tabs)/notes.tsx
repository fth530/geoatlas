import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { TOPIC_DETAILS } from '@/data/geography';
import { StudyNote, useStudy } from '@/context/StudyContext';
import { useColors } from '@/hooks/useColors';

const NOTE_CATEGORIES = ['Genel', ...TOPIC_DETAILS.map((topic) => topic.title)];

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, saveNote, deleteNote } = useStudy();
  const [editing, setEditing] = useState<StudyNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Genel');
  const [error, setError] = useState('');

  const startNew = () => {
    setEditing(null);
    setTitle('');
    setBody('');
    setCategory('Genel');
    setError('');
    setIsCreating(true);
  };
  const startEdit = (note: StudyNote) => {
    setEditing(note);
    setTitle(note.title);
    setBody(note.body);
    setCategory(note.category);
    setError('');
    setIsCreating(true);
  };
  const cancelEdit = () => {
    Keyboard.dismiss();
    setIsCreating(false);
    setEditing(null);
    setError('');
  };
  const submit = () => {
    if (!title.trim() || !body.trim()) {
      setError('Başlık ve kodlama notunu doldur.');
      return;
    }
    const note: StudyNote = {
      id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      body: body.trim(),
      category,
      updatedAt: Date.now(),
    };
    saveNote(note);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cancelEdit();
  };
  const confirmDelete = (note: StudyNote) => {
    Alert.alert('Not silinsin mi?', `“${note.title}” defterinden kaldırılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteNote(note.id) },
    ]);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 16 : insets.top + 12, paddingBottom: insets.bottom + 110 }]}
      bottomOffset={24}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>KİŞİSEL ÇALIŞMA ALANI</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Kodlama defteri</Text>
        </View>
        {!isCreating && (
          <Pressable onPress={startNew} style={[styles.addButton, { backgroundColor: colors.primary }]} testID="new-note">
            <Feather name="plus" size={17} color={colors.primaryForeground} />
            <Text style={[styles.addText, { color: colors.primaryForeground }]}>Yeni not</Text>
          </Pressable>
        )}
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Kendi hatırlatma kodlarını ve kısa notlarını burada sakla.</Text>

      {isCreating && (
        <View style={[styles.editor, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.editorHeader}>
            <View>
              <Text style={[styles.editorTitle, { color: colors.foreground }]}>{editing ? 'Notu düzenle' : 'Yeni kodlama'}</Text>
              <Text style={[styles.editorSubtitle, { color: colors.mutedForeground }]}>Öğrenme biçimine göre kısa ve akılda kalıcı yaz.</Text>
            </View>
            <Pressable accessibilityLabel="Düzenlemeyi kapat" onPress={cancelEdit} hitSlop={10}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Başlık</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn. Volkanik dağlar"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            returnKeyType="next"
            maxLength={70}
            testID="note-title"
          />
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Konu</Text>
          <View style={styles.categoryRow}>
            {NOTE_CATEGORIES.map((item) => {
              const active = category === item;
              return (
                <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, { backgroundColor: active ? colors.accent : colors.background, borderColor: active ? colors.accent : colors.border }]}>
                  <Text style={[styles.categoryText, { color: active ? colors.primary : colors.mutedForeground }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Kendi kodlaman / notun</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Kısa bir çağrışım, eşleştirme ya da sınav ipucu yaz…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            multiline
            textAlignVertical="top"
            maxLength={1200}
            testID="note-body"
          />
          {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
          <Pressable onPress={submit} style={[styles.saveButton, { backgroundColor: colors.primary }]} testID="save-note">
            <Feather name="check" size={16} color={colors.primaryForeground} />
            <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Deftere kaydet</Text>
          </Pressable>
        </View>
      )}

      {!isCreating && notes.length === 0 && (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}><Feather name="book-open" size={22} color={colors.primary} /></View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Defterin henüz boş</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Örneğin “Tendürek 3.533 m — Ağrı/Van” gibi bir kodlama ekleyebilirsin.</Text>
          <Pressable onPress={startNew} style={[styles.emptyButton, { backgroundColor: colors.accent }]}><Text style={[styles.emptyButtonText, { color: colors.primary }]}>İlk notunu oluştur</Text></Pressable>
        </View>
      )}

      {!isCreating && notes.length > 0 && (
        <View style={styles.notesList}>
          <View style={styles.listHeading}>
            <Text style={[styles.listTitle, { color: colors.foreground }]}>Kaydedilen notlar</Text>
            <Text style={[styles.noteCount, { color: colors.mutedForeground }]}>{notes.length} not</Text>
          </View>
          {notes.map((note) => (
            <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.noteTop}>
                <View style={[styles.noteTag, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.noteTagText, { color: colors.primary }]}>{note.category}</Text>
                </View>
                <Text style={[styles.noteDate, { color: colors.mutedForeground }]}>{new Date(note.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Text style={[styles.noteTitle, { color: colors.foreground }]}>{note.title}</Text>
              <Text style={[styles.noteBody, { color: colors.mutedForeground }]}>{note.body}</Text>
              <View style={[styles.noteActions, { borderTopColor: colors.border }]}>
                <Pressable accessibilityLabel={`${note.title} notunu düzenle`} onPress={() => startEdit(note)} style={styles.noteAction}>
                  <Feather name="edit-2" size={13} color={colors.primary} /><Text style={[styles.noteActionText, { color: colors.primary }]}>Düzenle</Text>
                </Pressable>
                <Pressable accessibilityLabel={`${note.title} notunu sil`} onPress={() => confirmDelete(note)} style={styles.noteAction}>
                  <Feather name="trash-2" size={13} color={colors.destructive} /><Text style={[styles.noteActionText, { color: colors.destructive }]}>Sil</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={[styles.reminder, { backgroundColor: colors.accent }]}>
        <Feather name="bookmark" size={15} color={colors.primary} />
        <Text style={[styles.reminderText, { color: colors.accentForeground }]}>
          {TOPIC_DETAILS.length} ana konu için kişisel kodlamalarını ayrı ayrı kaydedebilirsin. Notlar bu cihazda saklanır.
        </Text>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  title: { fontSize: 25, fontWeight: '700', marginTop: 4, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: -7 },
  addButton: { borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { fontSize: 11, fontWeight: '700' },
  editor: { borderRadius: 21, borderWidth: 1, padding: 15, gap: 10 },
  editorHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 },
  editorTitle: { fontSize: 15, fontWeight: '700' },
  editorSubtitle: { fontSize: 10, lineHeight: 15, marginTop: 3, maxWidth: 265 },
  inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: -5 },
  input: { minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10, fontSize: 12 },
  textArea: { minHeight: 116, lineHeight: 18 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoryChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  categoryText: { fontSize: 10, fontWeight: '600' },
  error: { fontSize: 11, marginTop: -3 },
  saveButton: { minHeight: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 3 },
  saveText: { fontSize: 12, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: 22, padding: 20, alignItems: 'center', gap: 10, marginTop: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyCopy: { fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 260 },
  emptyButton: { marginTop: 3, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 },
  emptyButtonText: { fontSize: 11, fontWeight: '700' },
  notesList: { gap: 10 },
  listHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 15, fontWeight: '700' },
  noteCount: { fontSize: 10 },
  noteCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 2, gap: 8 },
  noteTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  noteTagText: { fontSize: 9, fontWeight: '700' },
  noteDate: { fontSize: 9 },
  noteTitle: { fontSize: 14, fontWeight: '700' },
  noteBody: { fontSize: 11, lineHeight: 17 },
  noteActions: { borderTopWidth: 1, flexDirection: 'row', gap: 18, paddingTop: 9, marginTop: 1 },
  noteAction: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingBottom: 8 },
  noteActionText: { fontSize: 10, fontWeight: '600' },
  reminder: { borderRadius: 14, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  reminderText: { flex: 1, fontSize: 10, lineHeight: 16 },
});
