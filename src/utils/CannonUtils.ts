// MIT License
// Copyright (c) 2022, 2023, 2024 Sean Bradley
// Based on https://sbcode.net/threejs/physics-cannonDebugrenderer/#srcclientutilscannonutilsts
// Re written for my React Three Fiber course.
// Course Coupons @ https://sbcode.net/coupons
import * as THREE from 'three';

export class CannonUtils {
  static toTrimeshProps(geometry: THREE.BufferGeometry) {
    let vertices;
    if (geometry.index === null) {
      vertices = geometry.attributes.position.array;
    } else {
      vertices = geometry.clone().toNonIndexed().attributes.position.array;
    }
    if (geometry.index !== null) {
      return [vertices, geometry.index.array];
    }
  }

  static toConvexPolyhedronProps(geometry: THREE.BufferGeometry) {
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const vertices = [];
    for (let i = 0; i < position.count; i++) {
      vertices.push(new THREE.Vector3().fromBufferAttribute(position, i));
    }
    const faces = [];
    for (let i = 0; i < position.count; i += 3) {
      const vertexNormals =
        normal === undefined
          ? []
          : [
              new THREE.Vector3().fromBufferAttribute(normal, i),
              new THREE.Vector3().fromBufferAttribute(normal, i + 1),
              new THREE.Vector3().fromBufferAttribute(normal, i + 2),
            ];
      const face = {
        a: i,
        b: i + 1,
        c: i + 2,
        normals: vertexNormals,
      };
      faces.push(face);
    }

    const verticesMap = {};
    const points = [];
    const changes = [];
    for (let i = 0, il = vertices.length; i < il; i++) {
      const v = vertices[i];
      const key =
        Math.round(v.x * 100) +
        '_' +
        Math.round(v.y * 100) +
        '_' +
        Math.round(v.z * 100);
      if (verticesMap[key] === undefined) {
        verticesMap[key] = i;
        points.push({ x: vertices[i].x, y: vertices[i].y, z: vertices[i].z });
        changes[i] = points.length - 1;
      } else {
        changes[i] = changes[verticesMap[key]];
      }
    }

    const faceIdsToRemove = [];
    for (let i = 0, il = faces.length; i < il; i++) {
      const face = faces[i];
      face.a = changes[face.a];
      face.b = changes[face.b];
      face.c = changes[face.c];
      const indices = [face.a, face.b, face.c];
      for (let n = 0; n < 3; n++) {
        if (indices[n] === indices[(n + 1) % 3]) {
          faceIdsToRemove.push(i);
          break;
        }
      }
    }

    for (let i = faceIdsToRemove.length - 1; i >= 0; i--) {
      const idx = faceIdsToRemove[i];
      faces.splice(idx, 1);
    }

    const cannonFaces = faces.map(function (f) {
      return [f.a, f.b, f.c];
    });

    return [points.map((v) => [v.x, v.y, v.z]), cannonFaces];
  }

  static offsetCenterOfMass(body, centreOfMass) {
    body.shapeOffsets.forEach(function (offset) {
      centreOfMass.vadd(offset, centreOfMass);
    });
    centreOfMass.scale(1 / body.shapes.length, centreOfMass);
    body.shapeOffsets.forEach(function (offset) {
      offset.vsub(centreOfMass, offset);
    });
    const worldCenterOfMass = { x: 0, y: 0, z: 0 };
    body.vectorToWorldFrame(centreOfMass, worldCenterOfMass);
    body.position.vadd(worldCenterOfMass, body.position);
  }
}

export default CannonUtils;
