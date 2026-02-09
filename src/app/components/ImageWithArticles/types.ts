export type Article = {
  id: string;
  title: string;
  description: string | null;
  positionX: number | null;
  positionY: number | null;
  width: number | null;
  height: number | null;
};

export type ImageSize = {
  displayWidth: number;
  displayHeight: number;
  scaleX: number;
  scaleY: number;
  aspectRatio: number;
};

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type PositionWithSize = Position & Size;

export type ResizeHandle =
  | "se"
  | "sw"
  | "ne"
  | "nw"
  | "n"
  | "s"
  | "e"
  | "w"
  | null;

export type ArticleUpdate = {
  title: string;
  description: string;
};

export type ArticlePositionUpdate = {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
};

export type ArticleCreateData = {
  title: string;
  description: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
};

export type ImageWithArticlesProps = {
  imageSrc: string;
  imageAlt: string;
  originalWidth: number;
  originalHeight: number;
  articles: Article[];
  onArticleClick?: (articleId: string) => void;
  onArticleHover?: (articleId: string | null) => void;
  hoveredArticleId?: string | null;
  selectedArticleId?: string | null;
  isEditable?: boolean;
  className?: string;
  // Actions d'édition
  onArticleMove?: (articleId: string) => void;
  onArticleResize?: (articleId: string) => void;
  onArticleEdit?: (articleId: string) => void;
  onArticleDelete?: (articleId: string) => Promise<void>;
  onArticleUpdate?: (
    articleId: string,
    updates: ArticleUpdate,
  ) => Promise<void>;
  onArticlePositionUpdate?: (
    articleId: string,
    updates: ArticlePositionUpdate,
  ) => Promise<void>;
  onArticleCreate?: (articleData: ArticleCreateData) => Promise<void>;
  // Mode création
  createMode?: boolean;
  onCreateModeChange?: (createMode: boolean) => void;
};
