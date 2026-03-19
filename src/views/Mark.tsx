import { BookmarksProvider } from "@/contexts/BookmarksContext";
import MarkContent from "@/components/mark/MarkContent";

export default function Mark() {
  return (
    <BookmarksProvider>
      <MarkContent />
    </BookmarksProvider>
  );
}
