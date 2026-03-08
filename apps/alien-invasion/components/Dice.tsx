import React from 'react';

export const Dice = ({ value, color = "bg-white", dotColor = "bg-black" }: { value: number, color?: string, dotColor?: string }) => {
  const dotClass = `w-2.5 h-2.5 ${dotColor} rounded-full`;
  
  const Dot = () => <div className={dotClass} />;
  
  // Layouts for dice faces 1-6
  const faces: Record<number, React.ReactNode> = {
    1: <div className="flex items-center justify-center w-full h-full"><Dot /></div>,
    2: <div className="flex justify-between p-2 w-full h-full"><Dot /><div className="self-end"><Dot /></div></div>,
    3: <div className="flex justify-between p-2 w-full h-full"><Dot /><div className="self-center"><Dot /></div><div className="self-end"><Dot /></div></div>,
    4: <div className="flex justify-between p-2 w-full h-full flex-wrap content-between"><div className="w-full flex justify-between"><Dot /><Dot /></div><div className="w-full flex justify-between"><Dot /><Dot /></div></div>,
    5: <div className="flex justify-between p-2 w-full h-full flex-wrap content-between"><div className="w-full flex justify-between"><Dot /><Dot /></div><div className="w-full flex justify-center absolute inset-0 items-center"><Dot /></div><div className="w-full flex justify-between"><Dot /><Dot /></div></div>,
    6: <div className="flex justify-between p-2 w-full h-full flex-wrap content-between"><div className="w-full flex justify-between"><Dot /><Dot /></div><div className="w-full flex justify-between"><Dot /><Dot /></div><div className="w-full flex justify-between"><Dot /><Dot /></div></div>,
  };

  return (
    <div className={`relative w-16 h-16 ${color} rounded-xl shadow-lg border-2 border-gray-300 flex items-center justify-center animate-bounce`}>
       {faces[value] || faces[1]}
    </div>
  );
};