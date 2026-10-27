import React from 'react';
import {Composition} from 'remotion';
import Comp, {meta} from './Comp';

export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Comp}
    durationInFrames={meta.durationInFrames}
    fps={meta.fps}
    width={meta.width}
    height={meta.height}
  />
);
