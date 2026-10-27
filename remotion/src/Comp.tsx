import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';

export const meta = {fps: 30, width: 1280, height: 720, durationInFrames: 90};

const Comp: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 30], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#16181d', alignItems: 'center', justifyContent: 'center'}}>
      <h1 style={{color: '#fff', fontSize: 96, opacity: o, fontFamily: 'sans-serif'}}>Remotion siap</h1>
    </AbsoluteFill>
  );
};
export default Comp;
