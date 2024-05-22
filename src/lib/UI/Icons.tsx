import React from 'react';
import type { SVGProps } from 'react';

import { ReactComponent as ArmatureDaata } from 'src/icons/blender_icon_armature_data.svg';
import { ReactComponent as BoneData } from 'src/icons/blender_icon_bone_data.svg';
import { ReactComponent as CameraStereo } from 'src/icons/blender_icon_camera_stereo.svg';
import { ReactComponent as Camera } from 'src/icons/blender_icon_camera.svg';
//import { ReactComponent as CameraData } from 'src/icons/blender_icon_camera_data.svg';
//import { ReactComponent as CameraOrthographic } from 'src/icons/blender_icon_camera_orthographic.svg';
//import { ReactComponent as CameraPerspective } from 'src/icons/blender_icon_camera_perspective.svg';
//import { ReactComponent as CameraStereoData } from 'src/icons/blender_icon_camera_stereo_data.svg';
//import { ReactComponent as CameraStereoLeft } from 'src/icons/blender_icon_camera_stereo_left.svg';
//import { ReactComponent as CameraStereoRight } from 'src/icons/blender_icon_camera_stereo_right.svg';
import { ReactComponent as ConArmature } from 'src/icons/blender_icon_con_armature.svg';
import { ReactComponent as OutlinerDataArmature } from 'src/icons/blender_icon_outliner_data_armature.svg';
import { ReactComponent as OutlinerDataMesh } from 'src/icons/blender_icon_outliner_data_mesh.svg';
import { ReactComponent as OutlinerObArmature } from 'src/icons/blender_icon_outliner_ob_armature.svg';
import { ReactComponent as Physics } from 'src/icons/blender_icon_physics.svg';
import { ReactComponent as ZoomIn } from 'src/icons/blender_icon_zoom_in.svg';
import { ReactComponent as ZoomOut } from 'src/icons/blender_icon_zoom_out.svg';

// Rest of the code...

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  viewBox?: string;
  width?: number;
  height?: number;
}

// License CC BY 3.0: https://github.com/game-icons/icons/blob/master/license.txt
export const GameIconsSkeletonInside: React.FC<IconProps> = ({
  width = '1em',
  height = '1em',
  viewBox = '0 0 512 512',
  ...props
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={viewBox} {...props}>
      <path
        fill="currentColor"
        d="M299.53 18.813c-19.61.356-40.837 9.338-57.75 26.25c-21.96 21.96-30.517 51.24-24.218 74.75c-62.778-29-57.658-31.416-120.28-71.594c-10.073-6.463-19.442-9.42-27.813-9.814c-13.954-.654-25.118 5.805-32.126 14.938C26.13 67.956 24.96 89.496 48.28 107.75c31.027 24.286 58.843 41.04 79.032 59.47c20.19 18.427 32.648 40.59 28.344 70.03c-3.158 21.61-13.69 37.998-26.47 51.47c-12.778 13.47-27.746 24.486-41.436 36.686c-27.38 24.4-50.33 51.753-45.063 114.25c3.328 39.483 34.158 55.117 59.657 52.375c12.75-1.37 23.51-7.336 29.406-17.467c5.897-10.132 7.696-25.438-1.03-47.75c-7.595-19.416 3.102-40.836 18.343-57.094c15.24-16.26 36.83-28.82 58.875-25c6.175 1.07 11.42 4.72 15.03 9.155s5.996 9.62 7.97 15.25c3.946 11.26 6.27 24.674 9.125 38.563c5.71 27.777 13.662 55.967 33.062 68.468c37.964 24.468 75.258 17.422 91.906.47c8.325-8.478 11.915-18.86 9.126-31.157c-2.788-12.3-12.708-27.158-34.28-41.845c-23.665-16.11-32.656-48.29-33.845-80.125c-1.188-31.836 5.288-64.077 20.126-84.03c6.878-9.25 17.546-13.118 29.656-17.407c12.11-4.29 26.207-8.475 40.75-14.688c29.087-12.425 59.636-32.197 79.125-76.78c17.078-39.07 3.374-64.318-15.28-73.5c-9.328-4.593-20.13-5.132-30.438-.626c-10.31 4.504-20.43 14.186-27.44 31.75c-13.14 32.932-39.218 51.707-70.436 56.436c-6.214.942-12.614 1.356-19.188 1.313c-.446-.28-.895-.57-1.344-.845a95.2 95.2 0 0 0 16.844-13.406c30.064-30.065 35.05-73.856 11.125-97.782c-10.466-10.468-24.744-15.403-40-15.126zm-2.342 19.156c9.573-.19 18.524 3.17 25.093 10.28c15.017 16.25 11.9 45.956-6.967 66.375c-18.87 20.42-46.328 23.813-61.344 7.563c-15.017-16.25-11.9-45.987 6.968-66.407c10.613-11.485 23.94-17.57 36.25-17.81zM65.03 62.593l62.69 45.468l-10.282 15.626l-63.376-45.97l10.97-15.124zM439.095 85.03l16.094 9.5l-36.375 61.595l-13.032-14.656l33.314-56.44zm-296.22 34.032l39.94 28.97c-2.63 5.937-4.95 11.934-6.94 18.062l-43.28-31.406zm71.94 19.876c.728-.013 1.45-.007 2.186 0c31.214.28 65.063 7.677 92.844 27.687c-.43 33.283-4.878 58.947-21.28 86.25c-14.544-8.917-30.326-16.685-46.658-22.094l-15.47 46.25l29.72 5.908l-7.22 32.968c-27.694.27-53.706-1.247-78.03-14.5l7.438-33.906l29.625 5.875l15.874-47.5c-12.937-2.752-26.05-3.835-39.063-2.688c1.66-33.21 8.716-57.94 23.5-84.03c2.168-.07 4.343-.183 6.532-.22zm174.655 12.25l13.28 14.968l-75.813 28.594c.753-6.677 1.195-13.516 1.438-20.53l61.094-23.032zm-240.345 151.03l12.656 13.75l-52.31 48.157l-20.97-6.094l60.625-55.81zm111.156 22.626l23.033 49.03l-17.25 7.25l-22.72-48.343l16.938-7.936zm-177 51.125l18.94 5.5l3.874 84.905l-18.688.844l-4.125-91.25zm209.564 14.186l42.594 68.72l-15.875 9.843l-44.157-71.25l17.438-7.314z"
      ></path>
    </svg>
  );
};

export const BoneIcon: React.FC<IconProps> = ({ width = '1em', height = '1em', viewBox = '0 0 512 512', ...props }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={viewBox} {...props}>
      <path
        fill="currentColor"
        d="M388.508 494c-.824 0-1.5.68-1.5 1.5v1.5h-1.5c-.82 0-1.5.676-1.5 1.5s.68 1.5 1.5 1.5h1c.426 0 .766-.214 1.035-.502l4.963 4.965c-.291.268-.506.609-.506 1.037v1c0 .82.676 1.5 1.5 1.5s1.5-.68 1.5-1.5V505h1.5c.82 0 1.5-.676 1.5-1.5s-.68-1.5-1.5-1.5h-1c-.426 0-.766.214-1.035.502l-4.963-4.965c.29-.268.506-.609.506-1.037v-1c0-.82-.676-1.5-1.5-1.5z"
      />
    </svg>
  );
};

export {
  ArmatureDaata,
  BoneData,
  CameraStereo,
  Camera,
  ConArmature,
  OutlinerDataArmature,
  OutlinerDataMesh,
  OutlinerObArmature,
  Physics,
  ZoomIn,
  ZoomOut
};