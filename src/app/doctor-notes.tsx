import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Header, Screen } from '../components/HealthClanUI';
import { ActivityIndicator, Image, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

function doctorName(value: any) {
  return value?.doctor?.fullName || [value?.doctor?.firstName, value?.doctor?.lastName].filter(Boolean).join(' ') || 'Doctor';
}

function appointmentTime(value: any) {
  const raw = value?.completedAt || value?.endTime || value?.startTime;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString() : '';
}

function noteText(value: any) {
  return String(value?.consultationNotes || value?.notes || '').trim();
}

const documentLabels: Record<string, string> = {
  prescription: "Doctor's Prescription",
  sick_note: 'Sick note',
  attendance_note: 'Attendance note',
  referral_note: 'Referral note',
};

export default function DoctorNotes() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId) ? params.appointmentId[0] : params.appointmentId;
  const [notes, setNotes] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(appointmentId));
  const [message, setMessage] = useState('');
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const documents = Array.isArray(notes?.clinicalDocuments) ? notes.clinicalDocuments : [];

  function preview(document: any) {
    if (document.mimeType === 'application/pdf') {
      Linking.openURL(document.fileUrl);
      return;
    }
    setPreviewDocument(document);
  }

  function download(document: any) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const anchor = window.document.createElement('a');
      anchor.href = document.fileUrl;
      anchor.download = document.fileName || `${document.documentType || 'appointment-document'}`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }
    Linking.openURL(document.fileUrl);
  }

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    healthclanApi.doctors.notes(appointmentId)
      .then(setNotes)
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load consultation notes.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  return (
    <Screen>
      <Header title="Doctor Notes" backTo="/history" />
      {loading ? (
        <View style={styles.panel}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.copy}>Loading consultation notes...</Text>
        </View>
      ) : notes ? (
        <View style={styles.panel}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>N</Text>
          </View>
          <Text style={styles.heading}>After-visit notes</Text>
          <Text style={styles.meta}>{doctorName(notes)}{appointmentTime(notes) ? ` - ${appointmentTime(notes)}` : ''}</Text>
          {noteText(notes) ? <><View style={styles.noteBox}><Text style={styles.copy}>{noteText(notes)}</Text></View><Text style={styles.helper}>These notes were added by your doctor after the appointment.</Text></> : <Text style={styles.helper}>No consultation notes have been added yet.</Text>}

          <View style={styles.documentsSection}>
            <View style={styles.documentsHeading}>
              <View style={styles.documentHeadingIcon}><Ionicons name="documents-outline" size={21} color={colors.teal} /></View>
              <View style={styles.documentsHeadingText}><Text style={styles.documentsTitle}>Appointment documents</Text><Text style={styles.helperLeft}>Preview or download documents shared by your doctor.</Text></View>
            </View>
            {documents.length ? documents.map((document: any) => (
              <View key={document._id || document.fileUrl} style={styles.documentCard}>
                {document.mimeType?.startsWith('image/') ? <Image source={{ uri: document.fileUrl }} style={styles.documentThumb} resizeMode="cover" /> : <View style={styles.pdfThumb}><Ionicons name="document-text-outline" size={31} color={colors.teal} /><Text style={styles.pdfText}>PDF</Text></View>}
                <View style={styles.documentCopy}><Text style={styles.documentTitle}>{documentLabels[document.documentType] || String(document.documentType || 'Document').replace(/_/g, ' ')}</Text><Text style={styles.documentName} numberOfLines={1}>{document.fileName || 'Appointment document'}</Text></View>
                <Pressable style={styles.previewButton} onPress={() => preview(document)}><Ionicons name="eye-outline" size={18} color={colors.teal} /><Text style={styles.previewText}>Preview</Text></Pressable>
                <Pressable style={styles.downloadButton} onPress={() => download(document)}><Ionicons name="download-outline" size={18} color="#fff" /><Text style={styles.downloadText}>Download</Text></Pressable>
              </View>
            )) : <View style={styles.emptyDocuments}><Ionicons name="file-tray-outline" size={26} color={colors.muted} /><Text style={styles.helper}>No appointment documents have been shared yet.</Text></View>}
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>N</Text>
          </View>
          <Text style={styles.heading}>{message ? 'Unable to load notes' : 'No notes yet'}</Text>
          <Text style={styles.copy}>
            {message || 'After-visit notes will appear here once your doctor adds them for the completed appointment.'}
          </Text>
        </View>
      )}
      <Modal visible={Boolean(previewDocument)} transparent animationType="fade" onRequestClose={() => setPreviewDocument(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{documentLabels[previewDocument?.documentType] || 'Document preview'}</Text><Pressable style={styles.closeButton} onPress={() => setPreviewDocument(null)}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View>{previewDocument?.fileUrl ? <Image source={{ uri: previewDocument.fileUrl }} style={styles.previewImage} resizeMode="contain" /> : null}<Pressable style={styles.modalDownload} onPress={() => download(previewDocument)}><Ionicons name="download-outline" size={19} color="#fff" /><Text style={styles.downloadText}>Download document</Text></Pressable></View></View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12, alignItems: 'center' },
  icon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  heading: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  meta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  noteBox: { width: '100%', borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, padding: 16 },
  copy: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  helper: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  documentsSection: { width: '100%', marginTop: 8, gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 18 },
  documentsHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentHeadingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  documentsHeadingText: { flex: 1 },
  documentsTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  helperLeft: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  documentCard: { width: '100%', borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, padding: 10, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9 },
  documentThumb: { width: 58, height: 58, borderRadius: 12, backgroundColor: colors.field },
  pdfThumb: { width: 58, height: 58, borderRadius: 12, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  pdfText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 9, fontWeight: '900' },
  documentCopy: { flex: 1, minWidth: 150 },
  documentTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  documentName: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, fontWeight: '700', marginTop: 3 },
  previewButton: { minHeight: 40, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  previewText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900' },
  downloadButton: { minHeight: 40, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.teal },
  downloadText: { color: '#fff', fontFamily: 'Poppins', fontSize: 11, fontWeight: '900' },
  emptyDocuments: { minHeight: 100, borderRadius: 16, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(4,25,31,0.72)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 820, maxHeight: '92%', borderRadius: 22, backgroundColor: colors.white, padding: 14, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modalTitle: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  closeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.field },
  previewImage: { width: '100%', height: 520, maxHeight: '72%', borderRadius: 16, backgroundColor: colors.bg },
  modalDownload: { minHeight: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.teal },
});
