import type { PositionResult } from "./TeamMatches";
import BaseMatchModal from "./BaseMatchModal";

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
  positionResults: PositionResult[];
  onSave: (matchId: number, updatedResults: PositionResult[]) => Promise<void>;
  onDelete?: () => void;
}

export default function EditMatchModal({ 
  isOpen, 
  onClose, 
  matchId, 
  positionResults, 
  onSave, 
  onDelete 
}: EditMatchModalProps) {
  
  const handleSave = async (results: PositionResult[], opponentName?: string, matchDate?: string) => {
    await onSave(matchId, results);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      const response = await fetch(`/api/get-team-matches?id=${matchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete match');
      }

      onDelete();
    } catch (error) {
      console.error('Failed to delete match:', error);
      throw error;
    }
  };

  return (
    <BaseMatchModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Match Scores"
      onSave={handleSave}
      initialResults={positionResults}
      showDeleteButton={true}
      onDelete={handleDelete}
      showOpponentAndDate={false}
    />
  );
} 