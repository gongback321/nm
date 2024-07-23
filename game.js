// game.js
document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById('game-container');
  const player = document.getElementById('player');
  const woodCountElem = document.getElementById('wood-count');
  const spearCountElem = document.getElementById('spear-count');
  const craftingMenu = document.getElementById('crafting-menu');
  const craftSpearButton = document.getElementById('craft-spear-button');
  const messageElem = document.getElementById('message');
  const gameOverElem = document.getElementById('game-over');
  const restartButton = document.getElementById('restart-button');

  let playerX = window.innerWidth / 2;
  let playerY = window.innerHeight / 2;
  let woodCount = 0;
  let spearCount = 0;
  let isPaused = false;
  let isReadyToFire = false;
  let isDay = true;
  let zombies = [];
  let zombieInterval;

  player.style.left = `${playerX}px`;
  player.style.top = `${playerY}px`;

  // 초기 나무 생성
  for (let i = 0; i < 5; i++) {
    spawnTree();
  }

  // 아침/밤 사이클
  setInterval(() => {
    toggleDayNight();
  }, 60000); // 1분 간격

  // 플레이어 이동
  document.addEventListener('keydown', (event) => {
    if (isPaused) return;

    const speed = 10;
    switch(event.key) {
      case 'ArrowUp':
        playerY = Math.max(0, playerY - speed);
        break;
      case 'ArrowDown':
        playerY = Math.min(window.innerHeight - player.clientHeight, playerY + speed);
        break;
      case 'ArrowLeft':
        playerX = Math.max(0, playerX - speed);
        break;
      case 'ArrowRight':
        playerX = Math.min(window.innerWidth - player.clientWidth, playerX + speed);
        break;
    }
    player.style.left = `${playerX}px`;
    player.style.top = `${playerY}px`;
  });

  // 나무 캐기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'z' || event.key === 'Z') {
      const trees = document.querySelectorAll('.tree');
      trees.forEach(tree => {
        if (isColliding(player, tree)) {
          const log = document.createElement('div');
          log.classList.add('log');
          log.style.left = tree.style.left;
          log.style.top = tree.style.top;
          gameContainer.appendChild(log);
          gameContainer.removeChild(tree);
          setTimeout(spawnTree, 5000); // 5초 후 나무 재스폰
        }
      });
    }
  });

  // 통나무 줍기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'f' || event.key === 'F') {
      const logs = document.querySelectorAll('.log');
      logs.forEach(log => {
        if (isColliding(player, log)) {
          woodCount++;
          woodCountElem.textContent = woodCount;
          gameContainer.removeChild(log);
        }
      });
    }
  });

  // 조합창 토글
  document.addEventListener('keydown', (event) => {
    if (event.key === 'b' || event.key === 'B') {
      craftingMenu.classList.toggle('hidden');
    }
  });

  // 나무 창 제작
  craftSpearButton.addEventListener('click', () => {
    if (woodCount >= 5) {
      woodCount -= 5;
      woodCountElem.textContent = woodCount;
      spearCount++;
      spearCountElem.textContent = spearCount;
    } else {
      showMessage('통나무가 부족합니다');
    }
  });

  // 나무 창 발사 준비 및 해제
  document.addEventListener('keydown', (event) => {
    if (event.key === 'e' || event.key === 'E') {
      if (isReadyToFire) {
        isPaused = false;
        isReadyToFire = false;
        showMessage('나무 창 발사 준비가 해제되었습니다.');
      } else if (spearCount > 0) {
        isPaused = true;
        isReadyToFire = true;
        showMessage('나무 창을 발사할 준비가 되었습니다. 마우스를 클릭하세요.');
      } else {
        showMessage('나무 창이 없습니다');
      }
    }
  });

  // 마우스 클릭으로 나무 창 발사
  gameContainer.addEventListener('click', (event) => {
    if (isPaused && isReadyToFire && spearCount > 0) {
      const spear = document.createElement('div');
      spear.classList.add('spear');
      spear.style.left = `${playerX + player.clientWidth / 2}px`;
      spear.style.top = `${playerY + player.clientHeight / 2}px`;

      const angle = Math.atan2(event.clientY - (playerY + player.clientHeight / 2), event.clientX - (playerX + player.clientWidth / 2));
      spear.style.transform = `rotate(${angle}rad)`;

      gameContainer.appendChild(spear);
      spearCount--;
      spearCountElem.textContent = spearCount;

      const speed = 5;
      const moveSpear = () => {
        spear.style.left = `${parseFloat(spear.style.left) + Math.cos(angle) * speed}px`;
        spear.style.top = `${parseFloat(spear.style.top) + Math.sin(angle) * speed}px`;

        if (parseFloat(spear.style.left) < 0 || parseFloat(spear.style.left) > window.innerWidth || parseFloat(spear.style.top) < 0 || parseFloat(spear.style.top) > window.innerHeight) {
          spear.remove();
        } else {
          // 창이 좀비와 충돌하는지 확인
          const zombies = document.querySelectorAll('.zombie');
          zombies.forEach(zombie => {
            if (isColliding(spear, zombie)) {
              gameContainer.removeChild(zombie);
              spear.remove();
            }
          });
          requestAnimationFrame(moveSpear);
        }
      };
      moveSpear();

      isPaused = false;
      isReadyToFire = false;
    }
  });

  // 재시작 버튼 클릭
  restartButton.addEventListener('click', () => {
    window.location.reload();
  });

  // 아침/밤 전환
  function toggleDayNight() {
    isDay = !isDay;
    if (isDay) {
      document.body.classList.remove('night-mode');
      clearInterval(zombieInterval);
      zombies.forEach(zombie => gameContainer.removeChild(zombie));
      zombies = [];
    } else {
      document.body.classList.add('night-mode');
      zombieInterval = setInterval(spawnZombie, 10000); // 10초마다 좀비 생성
    }
  }

  // 좀비 생성
  function spawnZombie() {
    const zombie = document.createElement('div');
    zombie.classList.add('zombie');
    zombie.style.left = `${Math.random() * (window.innerWidth - 40)}px`;
    zombie.style.top = `${Math.random() * (window.innerHeight - 60)}px`;
    gameContainer.appendChild(zombie);
    zombies.push(zombie);
  }

  // 좀비 추적
  function moveZombies() {
    zombies.forEach(zombie => {
      const zombieX = parseFloat(zombie.style.left);
      const zombieY = parseFloat(zombie.style.top);
      const angle = Math.atan2(playerY - zombieY, playerX - zombieX);
      const speed = 2;

      zombie.style.left = `${zombieX + Math.cos(angle) * speed}px`;
      zombie.style.top = `${zombieY + Math.sin(angle) * speed}px`;
    });
  }

  // 게임 오버 체크
  function checkGameOver() {
    zombies.forEach(zombie => {
      if (isColliding(player, zombie)) {
        gameOver();
      }
    });
  }

  // 게임 오버 처리
  function gameOver() {
    isPaused = true;
    clearInterval(zombieInterval);
    showMessage('게임 오버');
    gameOverElem.style.display = 'block';
  }

  // 메시지 표시
  function showMessage(message) {
    messageElem.textContent = message;
    messageElem.classList.remove('hidden');
    setTimeout(() => {
      messageElem.classList.add('hidden');
    }, 2000);
  }

  // 나무 스폰
  function spawnTree() {
    const tree = document.createElement('div');
    tree.classList.add('tree');
    tree.style.left = `${Math.random() * (window.innerWidth - 40)}px`;
    tree.style.top = `${Math.random() * (window.innerHeight - 60)}px`;
    gameContainer.appendChild(tree);
  }

  // 충돌 확인
  function isColliding(a, b) {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    return !(
      aRect.top > bRect.bottom ||
      aRect.bottom < bRect.top ||
      aRect.left > bRect.right ||
      aRect.right < bRect.left
    );
  }

  // 게임 루프
  setInterval(() => {
    if (!isPaused) {
      moveZombies();
      checkGameOver();
    }
  }, 100);

});

