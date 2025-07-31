"use client";

import { useState } from "react";
import type { PositionResult } from "./TeamMatches";
import BaseMatchModal from "./BaseMatchModal";

interface EnterMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opponentName: string, matchDate: string, results: PositionResult[]) => Promise<void>;
}

export default function EnterMatchModal({ isOpen, onClose, onSave }: EnterMatchModalProps) {
  const [opponentName, setOpponentName] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);

  const resetForm = () => {
    setOpponentName("");
    setMatchDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async (results: PositionResult[], opponentName?: string, matchDate?: string) => {
    if (opponentName && matchDate) {
      await onSave(opponentName, matchDate, results);
      resetForm();
    }
  };

  return (
    <BaseMatchModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Enter Match Results"
      onSave={handleSave}
      showDeleteButton={false}
      showOpponentAndDate={true}
      initialOpponentName={opponentName}
      initialMatchDate={matchDate}
    />
  );
}
