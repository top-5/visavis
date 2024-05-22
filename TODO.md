# Nice features

- Helper Alpha = 19, Debug Alpha = 40, Face - nice mode

# Materials

- Eyes material

  const eyes = scene.getObjectByName("EyeLeft") as SkinnedMesh;
  const eyeMaterial = eyes.material as MeshStandardMaterial;
  eyeMaterial.transparent = true;
  eyeMaterial.opacity = 0.5;
  eyeMaterial.blending = 1;
  eyeMaterial.metalness = 1;
  eyes.material = eyeMaterial;
  eyeMaterial.needsUpdate = true;

- Wobbly hair

  setInterval(() => {
  let currentHairPosition = new Vector3();
  currentHairPosition.copy(hair.position);
  // Convert to world coordinates
  currentHairPosition.applyMatrix4(hair.matrixWorld);
  // Calculate the distance between the current and last position
  let distance = currentHairPosition.distanceTo(lastHairPosition);
  // Set the factor based on the distance
  // (wobble as any).factor = distance _ 0.5;
  setWobbleSpeed(distance _ 2);
  lastHairPosition.copy(hair.position);
  // Convert to world coordinates
  lastHairPosition.applyMatrix4(hair.matrixWorld);
  }, 100);

  - CRAZY STUFF

    const RecursiveBone: FC<{ object: Object3D }> = ({ object }) => {
    if (object.children.length > 0) {
    let result = [];
    for (let i = 0; i < object.children.length; i++) {
    let obj = object.children[i];
    let objRender = (
    <>
    <BonePhysics name={`RigidBody_${obj.name}`}
    position={obj.position} quaternion={obj.quaternion} scale={obj.scale}
    child={obj} parent={obj.parent!}>
    <primitive object={obj} key={object.name} parent={object.parent!} />
    {object.children.map(child => { return RecursiveBone({ object: child }); })}
    </BonePhysics>
    </>
    );
    result.push(objRender);
    };
    return result;
    }
    let obj = object;
    return (
    <>
    <BonePhysics name={`RigidBody_${obj.name}`}
    position={obj.position} quaternion={obj.quaternion} scale={obj.scale}
    child={obj} parent={obj.parent!}>
    <primitive object={obj} key={object.name} parent={object.parent!} />
    </BonePhysics>
    </>
    );
    }

    return (
    <RecursiveBone object={helper.armature!} />
    )


-- CONSIDER

```
npm install @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties --save-dev
```

Update config-overrides.js:

```
module.exports = function override(config, env) {
  const babelLoader = config.module.rules.find(
    (rule) => rule.oneOf !== undefined
  ).oneOf.find((rule) => rule.loader && rule.loader.includes("babel-loader"));

  babelLoader.options.plugins = [
    ...babelLoader.options.plugins,
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose": true }]
  ];

  return config;
};
```