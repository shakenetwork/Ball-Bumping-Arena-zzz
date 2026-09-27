/* Arena skill effects and status marks. No gameplay or collision state lives here. */
(function (global) {
  'use strict';

  function create(THREE, scene, floorY) {
    const active = new Set();
    const sleepIndicators = new Map();
    const reducedMotion = global.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    function addLine(group, points, material) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 7;
      line.frustumCulled = false;
      group.add(line);
    }

    function dispose(effect) {
      scene.remove(effect.group);
      const geometries = new Set();
      const materials = new Set();
      effect.group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (Array.isArray(object.material)) object.material.forEach((material) => materials.add(material));
        else if (object.material) materials.add(object.material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      active.delete(effect);
    }

    function disposeSleepIndicator(indicator) {
      scene.remove(indicator.sprite);
      indicator.texture.dispose();
      indicator.material.dispose();
      sleepIndicators.delete(indicator.key);
    }

    function createSleepIndicator(key) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = '900 152px system-ui, sans-serif';
      context.lineJoin = 'round';
      context.shadowColor = '#d9c8ff';
      context.shadowBlur = 34;
      context.lineWidth = 25;
      context.strokeStyle = '#332b48';
      context.strokeText('ZZZ', 256, 128);
      context.fillStyle = '#fff4c2';
      context.fillText('ZZZ', 256, 128);
      context.shadowBlur = 0;
      context.font = '900 30px system-ui, sans-serif';
      context.fillStyle = '#d9c8ff';
      context.fillText('· · ·', 256, 225);

      const texture = new THREE.CanvasTexture(canvas);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(2.15, 1.08, 1);
      sprite.renderOrder = 9;
      scene.add(sprite);
      return { key, sprite, texture, material, elapsed: 0 };
    }

    function setSleepIndicator({ key, x, z, visible }) {
      if (!Number.isInteger(key) || !Number.isFinite(x) || !Number.isFinite(z)) return false;
      let indicator = sleepIndicators.get(key);
      if (!visible) {
        if (indicator) disposeSleepIndicator(indicator);
        return false;
      }
      if (!indicator) {
        indicator = createSleepIndicator(key);
        if (!indicator) return false;
        sleepIndicators.set(key, indicator);
      }
      const bob = reducedMotion ? 0 : Math.sin(indicator.elapsed * 4.2 + key) * 0.1;
      const drift = reducedMotion ? 0 : Math.sin(indicator.elapsed * 1.8 + key) * 0.12;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(indicator.elapsed * 4.2 + key) * 0.07;
      indicator.sprite.position.set(x + drift, floorY + 2.05 + bob, z);
      indicator.sprite.scale.set(2.15 * pulse, 1.08 * pulse, 1);
      indicator.material.rotation = reducedMotion ? 0 : Math.sin(indicator.elapsed * 2.2 + key) * 0.055;
      return true;
    }

    function trigger({ type, x, z, heading, direction = 1, color, arcAngle = 0.95 }) {
      if (!['rush', 'guard', 'arc', 'shrink', 'sleep'].includes(type) || ![x, z, heading].every(Number.isFinite)) return false;
      const group = new THREE.Group();
      group.position.set(x, floorY, z);
      const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.055, 7, 48), ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.renderOrder = 6;
      group.add(ring);

      const accent = type === 'guard' ? '#b9f5ff'
        : type === 'arc' || type === 'sleep' ? '#fff0ad'
          : type === 'shrink' ? '#b8ff73' : color;
      const accentMaterial = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.96, depthTest: false, depthWrite: false });
      const forwardX = Math.sin(heading);
      const forwardZ = Math.cos(heading);
      const sideX = Math.cos(heading);
      const sideZ = -Math.sin(heading);

      if (type === 'rush') {
        for (const offset of [-0.42, 0, 0.42]) {
          addLine(group, [
            new THREE.Vector3(forwardX * 0.45 + sideX * offset, 0.045, forwardZ * 0.45 + sideZ * offset),
            new THREE.Vector3(forwardX * 3.3 + sideX * offset * 1.7, 0.045, forwardZ * 3.3 + sideZ * offset * 1.7),
          ], accentMaterial);
        }
      } else if (type === 'guard') {
        const shieldMaterial = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.98, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
        const shield = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.095, 8, 12), shieldMaterial);
        shield.rotation.x = Math.PI / 2;
        shield.rotation.y = Math.PI / 6;
        shield.renderOrder = 7;
        group.add(shield);
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 * i / 8;
          const outward = new THREE.Vector3(Math.cos(angle), 0.06, Math.sin(angle));
          const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
          addLine(group, [
            outward.clone().multiplyScalar(0.92),
            outward.clone().multiplyScalar(1.2).add(tangent.clone().multiplyScalar(0.12)),
            outward.clone().multiplyScalar(1.52),
          ], accentMaterial);
        }
      } else if (type === 'shrink') {
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 * i / 8;
          const start = new THREE.Vector3(Math.cos(angle) * 0.48, 0.07, Math.sin(angle) * 0.48);
          const end = new THREE.Vector3(Math.cos(angle) * 1.12, 0.07, Math.sin(angle) * 1.12);
          addLine(group, [start, end], accentMaterial);
        }
      } else if (type === 'sleep') {
        for (let i = 0; i < 3; i++) {
          const x = 0.48 + i * 0.13;
          const y = 0.68 + i * 0.2;
          const width = 0.2 - i * 0.035;
          const height = 0.14 - i * 0.02;
          addLine(group, [
            new THREE.Vector3(x, y, 0.12),
            new THREE.Vector3(x + width, y, 0.12),
            new THREE.Vector3(x, y + height, 0.12),
            new THREE.Vector3(x + width, y + height, 0.12),
          ], accentMaterial);
        }
      } else {
        const points = [];
        const angle = Math.max(0.2, arcAngle) * direction;
        const length = 4.1;
        for (let i = 0; i <= 28; i++) {
          const t = i / 28;
          const delta = angle * t;
          const localX = Math.abs(angle) < 0.01
            ? length * t * forwardX
            : length * (Math.cos(heading) - Math.cos(heading + delta)) / angle;
          const localZ = Math.abs(angle) < 0.01
            ? length * t * forwardZ
            : length * (Math.sin(heading + delta) - Math.sin(heading)) / angle;
          points.push(new THREE.Vector3(localX, 0.05, localZ));
        }
        addLine(group, points, accentMaterial);
        const secondaryPoints = points.map((point, index) => new THREE.Vector3(
          point.x + sideX * direction * Math.min(0.26, index / 28 * 0.26),
          point.y + 0.008,
          point.z + sideZ * direction * Math.min(0.26, index / 28 * 0.26),
        ));
        addLine(group, secondaryPoints, ringMaterial);
      }

      const particleMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.98, depthTest: false, depthWrite: false });
      const particles = [];
      const particleCount = reducedMotion ? 5 : 11;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.PI * 2 * i / particleCount + Math.random() * 0.25;
        const speed = 1.1 + Math.random() * 2.1;
        const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08 + Math.random() * 0.045, 0), particleMaterial);
        mesh.position.set(Math.cos(angle) * 0.48, 0.12 + Math.random() * 0.18, Math.sin(angle) * 0.48);
        mesh.renderOrder = 7;
        group.add(mesh);
        const radialDirection = type === 'shrink' ? -1 : 1;
        particles.push({ mesh, vx: Math.cos(angle) * speed * radialDirection, vz: Math.sin(angle) * speed * radialDirection, vy: 0.65 + Math.random() * 0.8 });
      }

      scene.add(group);
      active.add({ type, group, ring, ringMaterial, particles, life: reducedMotion ? 0.32 : 0.72, total: reducedMotion ? 0.32 : 0.72 });
      return true;
    }

    function update(dt, paused = false) {
      if (paused || !Number.isFinite(dt) || dt <= 0) return;
      for (const indicator of sleepIndicators.values()) indicator.elapsed += dt;
      for (const effect of [...active]) {
        effect.life -= dt;
        const progress = Math.max(0, effect.life / effect.total);
        const ringScale = effect.type === 'shrink'
          ? 0.62 + progress * 1.1
          : 0.7 + (1 - progress) * (effect.group.children.length > 4 ? 1.1 : 0.72);
        effect.ring.scale.setScalar(ringScale);
        effect.ringMaterial.opacity = progress;
        for (const particle of effect.particles) {
          particle.mesh.position.x += particle.vx * dt;
          particle.mesh.position.z += particle.vz * dt;
          particle.mesh.position.y += particle.vy * dt;
          particle.vy -= 2.4 * dt;
          particle.mesh.scale.multiplyScalar(Math.max(0.01, 1 - dt * 1.8));
          particle.mesh.material.opacity = progress;
        }
        effect.group.children.forEach((child) => {
          if (child.isLine) child.material.opacity = progress;
          else if (child.geometry?.type === 'TorusGeometry' && child !== effect.ring) child.material.opacity = progress;
        });
        if (effect.life <= 0) dispose(effect);
      }
    }

    function clear() {
      for (const effect of [...active]) dispose(effect);
      for (const indicator of [...sleepIndicators.values()]) disposeSleepIndicator(indicator);
    }

    return Object.freeze({ trigger, update, setSleepIndicator, clear });
  }

  global.SkillEffects = Object.freeze({ create });
})(window);
