import { motion } from "motion/react";

export const CustomCard = ({ text, className }: { text: string; className?: string }) => {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className={`relative aspect-square flex items-center justify-center w-full h-full rounded-3xl shadow-xl ${className} transition-colors duration-300 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600`}
        >
            <div className="relative z-10 flex items-center justify-center">
                <div className="relative h-44 w-44 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                    <div className="absolute w-full h-full bg-black/[0.3] blur-sm rounded-full" />
                    <span className="text-white z-20">{text}</span>
                </div>
            </div>
        </motion.div>
    );
};