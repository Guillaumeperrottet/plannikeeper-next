"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";

const Switch = () => {
  const [isDark, setIsDark] = useState(false);

  // Initialiser l'état du thème au chargement
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const initialDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(initialDark);

    // Appliquer le thème initial
    if (initialDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Gérer le changement de thème
  const toggleTheme = () => {
    setIsDark((prevDark) => {
      const newDark = !prevDark;

      // Mettre à jour localStorage et les classes CSS
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }

      return newDark;
    });
  };

  return (
    <StyledWrapper>
      <label className="container">
        <input type="checkbox" checked={isDark} onChange={toggleTheme} />
        <svg
          viewBox="0 0 384 512"
          height="1em"
          xmlns="http://www.w3.org/2000/svg"
          className="moon"
        >
          <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z" />
        </svg>
        <svg
          viewBox="0 0 512 512"
          height="1em"
          xmlns="http://www.w3.org/2000/svg"
          className="sun"
        >
          <path d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" />
        </svg>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  height: 100%;

  /*------ Settings ------*/
  .container {
    --color-light: #64748b; /* Couleur sobre pour le mode clair */
    --color-dark: #e2e8f0; /* Couleur beaucoup plus claire pour le mode sombre */
    --size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    cursor: pointer;
    font-size: var(--size);
    user-select: none;
    fill: var(--color-light);
    transition: all 0.3s ease;
  }

  /* Mode sombre */
  .dark .container {
    fill: var(--color-dark);
  }

  .container .moon {
    position: absolute;
    animation: keyframes-fill 0.5s;
    opacity: 1;
    transition: all 0.3s ease;
  }

  .container .sun {
    position: absolute;
    display: none;
    animation: keyframes-fill 0.5s;
    opacity: 0;
    transition: all 0.3s ease;
  }

  /* ------ On check event ------ */
  .container input:checked ~ .moon {
    display: none;
    opacity: 0;
  }

  .container input:checked ~ .sun {
    display: block;
    opacity: 1;
  }

  /* ------ Hide the default checkbox ------ */
  .container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  /* ------ Animation ------ */
  @keyframes keyframes-fill {
    0% {
      transform: rotate(-360deg) scale(0);
      opacity: 0;
    }

    75% {
      transform: rotate(25deg);
    }
  }

  /* Effet de survol */
  .container:hover {
    transform: scale(1.05);
    fill: #475569; /* Couleur légèrement plus foncée au survol */
  }

  .dark .container:hover {
    fill: #f1f5f9; /* Couleur encore plus claire au survol en mode sombre */
  }

  /* Zone de touche agrandie pour mobile */
  @media (max-width: 768px) {
    .container {
      --size: 28px;
      padding: 8px;
    }

    .container::after {
      content: "";
      position: absolute;
      top: -8px;
      left: -8px;
      right: -8px;
      bottom: -8px;
      border-radius: 50%;
    }
  }

  /* Transition d'appui pour le mobile */
  .container:active {
    transform: scale(0.95);
  }
`;

export default Switch;
