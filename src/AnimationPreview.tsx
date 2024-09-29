import React from 'react';
import { motion, useAnimation, AnimationControls } from 'framer-motion';
import { Curve } from './curves.js';

interface AnimationPreviewProps {
    selectedCurve: Curve;
    duration: number;
}

export default function AnimationPreview({ selectedCurve, duration }: AnimationPreviewProps) {
    const controls = useAnimation();
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
        let isMounted = true;

        const animateSequence = async (animationControls: AnimationControls) => {
            if (!isMounted) return;

            setIsAnimating(true);

            // Main animation
            await animationControls.start({
                y: -50,
                transition: {
                    duration: duration / 1000,
                    ...(selectedCurve.type === 'spring'
                        ? {
                            type: 'spring',
                            stiffness: selectedCurve.stiffness,
                            damping: selectedCurve.damping,
                            mass: selectedCurve.mass,
                        }
                        : {
                            type: 'tween',
                            ease: selectedCurve.values,
                        }),
                },
            });

            if (!isMounted) return;

            // Wait for 0.5 seconds
            await new Promise(resolve => setTimeout(resolve, 750));

            if (!isMounted) return;

            // Quick return to original position
            await animationControls.start({
                y: 50,
                transition: { duration: 0.2, ease: 'easeInOut' },
            });

            if (!isMounted) return;

            // Wait for 0.5 seconds before restarting
            await new Promise(resolve => setTimeout(resolve, 500));

            if (isMounted) {
                setIsAnimating(false);
                animateSequence(animationControls);
            }
        };

        animateSequence(controls);

        return () => {
            isMounted = false;
        };
    }, [controls, selectedCurve, duration]);

    return (
        <div className="w-full h-full bg-[#3C3C3C] rounded-lg flex items-center justify-center" aria-label="Animation Preview">
            <motion.div
                className="w-16 h-16 bg-[#0D99FF] rounded"
                animate={controls}
                initial={{ y: 50 }}
            />
        </div>
    );
}