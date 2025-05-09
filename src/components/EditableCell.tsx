'use client';

import React, { useState, useEffect } from 'react';

export default function EditableCell({
  value,
  onConfirm,
  setIsPlaying, // Receive setIsPlaying to pause game when editing
}: {
  value: number;
  onConfirm: (val: number) => void;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>; // Function to control the game pause state
}) {
  const [inputVal, setInputVal] = useState(value.toFixed(2));
  const [isEditing, setIsEditing] = useState(false);

  // Update the input only if the user isn't editing (to prevent overwriting while typing)
  useEffect(() => {
    if (!isEditing) {
      setInputVal(value.toFixed(2)); // Sync the input with the external value if not editing
    }
  }, [value, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setIsEditing(true);
  };

  const handleConfirm = () => {
    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) {
      onConfirm(parsed);
    }
    setIsEditing(false); // Stop editing after confirm
    setIsPlaying(true);  // Resume the game after editing
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm(); // Confirm on Enter key press
    }
  };

  const handleEditClick = () => {
    setIsEditing(true); // Start editing
    setIsPlaying(false); // Pause the simulation when editing
  };

  return (
    <td style={{ padding: '4px', border: '1px solid gray' }}>
      {isEditing ? (
        <input
          type="number"
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyPress} // Confirm on Enter key press
          onBlur={handleConfirm} // Lose focus to confirm
          autoFocus
          style={{ width: '80px' }}
        />
      ) : (
        <>
          <span>{inputVal}</span>
            <img
            src="/edit-button.svg"
            alt="Edit"
            onClick={handleEditClick}
            style={{ marginLeft: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
            />
        </>
      )}
      {isEditing && (
        <img
          src="/check-mark.svg"
          alt="Confirm"
          onClick={handleConfirm}
          style={{ marginLeft: '4px', cursor: 'pointer', width: '16px', height: '16px' }}
        />
      )}
    </td>
  );
}
