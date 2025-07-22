import React from "react";
import styled from "styled-components";

type DropdownMenuProps = {
  items: { id: string; label: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  label?: string;
};

const DropdownMenu = ({
  items,
  selectedId,
  onSelect,
  label,
}: DropdownMenuProps) => {
  return (
    <StyledWrapper>
      <div className="menu">
        <div className="item">
          <button className="link">
            <span>{label || "Sélectionner"}</span>
            {/* ...svg ici... */}
          </button>
          <div className="submenu">
            {items.map((item) => (
              <div className="submenu-item" key={item.id}>
                <button
                  className="submenu-link"
                  style={{
                    fontWeight: selectedId === item.id ? "bold" : undefined,
                  }}
                  onClick={() => onSelect(item.id)}
                >
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .menu {
    font-size: 16px;
    line-height: 1.6;
    color: hsl(20 14.3% 4.1%);
    width: fit-content;
    display: flex;
    list-style: none;
  }

  .menu a {
    text-decoration: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  .menu .link {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px 36px;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
    background: hsl(0 0% 100%) !important;
    color: hsl(20 14.3% 4.1%) !important;
    border: 1px solid hsl(20 5.9% 90%) !important;
  }

  .menu .link::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: hsl(24 9.8% 10%);
    z-index: -1;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .menu .link svg {
    width: 14px;
    height: 14px;
    fill: hsl(20 14.3% 4.1%);
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .menu .item {
    position: relative;
  }

  .menu .item .submenu {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    top: 100%;
    border-radius: 0 0 16px 16px;
    left: 0;
    width: 100%;
    overflow: hidden;
    border: 1px solid hsl(20 5.9% 90%) !important;
    background: hsl(0 0% 100%) !important;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-12px);
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 1;
    pointer-events: none;
    list-style: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  .menu .item:hover .submenu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
    border-top: transparent;
    border-color: hsl(24 9.8% 10%);
  }

  .menu .item:hover .link {
    color: hsl(60 9.1% 97.8%) !important;
    background: hsl(24 9.8% 10%) !important;
    border-radius: 16px 16px 0 0;
  }

  .menu .item:hover .link::after {
    transform: scaleX(1);
    transform-origin: right;
  }

  .menu .item:hover .link svg {
    fill: hsl(60 9.1% 97.8%);
    transform: rotate(-180deg);
  }

  .submenu .submenu-item {
    width: 100%;
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .submenu .submenu-link {
    display: block;
    padding: 12px 24px;
    width: 100%;
    position: relative;
    text-align: center;
    background: hsl(0 0% 100%) !important;
    color: hsl(20 14.3% 4.1%) !important;
    border: none;
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .submenu .submenu-item:last-child .submenu-link {
    border-bottom: none;
  }

  .submenu .submenu-link::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    transform: scaleX(0);
    width: 100%;
    height: 100%;
    background-color: hsl(24 9.8% 10%);
    z-index: -1;
    transform-origin: left;
    transition: transform 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .submenu .submenu-link:hover:before {
    transform: scaleX(1);
    transform-origin: right;
  }

  .submenu .submenu-link:hover {
    color: hsl(60 9.1% 97.8%) !important;
    background: hsl(24 9.8% 10%) !important;
  }
`;

export default DropdownMenu;
