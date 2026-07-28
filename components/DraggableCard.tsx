import React, { useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripHorizontal } from 'lucide-react';
import WeatherCard from './WeatherCard';
import { CityWeather } from '../types';

interface DraggableCardProps {
    city: CityWeather;
    index: number;
}

/**
 * A draggable wrapper around the WeatherCard component.
 * Uses framer-motion for drag interactions.
 */
const DraggableCard: React.FC<DraggableCardProps> = ({ city, index }) => {
    const controls = useDragControls();
    const [isDragging, setIsDragging] = useState(false);

    return (
        <Reorder.Item
            value={city}
            id={String(city.id)}
            drag
            dragListener={false}
            dragControls={controls}
            className={`relative h-full w-full ${isDragging ? 'z-50' : 'z-auto'}`}
            layout
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => {
                setIsDragging(true);
                document.body.style.cursor = 'grabbing';
            }}
            onDragEnd={() => {
                setIsDragging(false);
                document.body.style.cursor = 'auto';
            }}
            whileDrag={{
                scale: 1.05,
                zIndex: 100,
                boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px rgba(96, 165, 250, 0.6)",
            }}
            transition={{ duration: 0.2 }}
        >
            <div
                className="absolute top-2 left-1/2 -translate-x-1/2 z-40 cursor-grab active:cursor-grabbing p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all touch-none"
                onPointerDown={(e) => controls.start(e)}
                title="Drag to reorder"
            >
                <GripHorizontal size={24} />
            </div>
            <WeatherCard data={city} index={index} disableEntryAnimation={true} />
        </Reorder.Item>
    );
};

export default DraggableCard;
