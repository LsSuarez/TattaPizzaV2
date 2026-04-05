import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

export interface CartItem {
  menuItemId: number;
  name: string;
  category: string;
  size: "small" | "medium" | "large" | null;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; menuItemId: number; size: string | null }
  | { type: "UPDATE_QTY"; menuItemId: number; size: string | null; quantity: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const key = `${action.item.menuItemId}-${action.item.size}`;
      const idx = state.items.findIndex((i) => `${i.menuItemId}-${i.size}` === key);
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + action.item.quantity };
        return { items };
      }
      return { items: [...state.items, action.item] };
    }
    case "REMOVE_ITEM": {
      const key = `${action.menuItemId}-${action.size}`;
      return { items: state.items.filter((i) => `${i.menuItemId}-${i.size}` !== key) };
    }
    case "UPDATE_QTY": {
      const key = `${action.menuItemId}-${action.size}`;
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => `${i.menuItemId}-${i.size}` !== key) };
      }
      return {
        items: state.items.map((i) =>
          `${i.menuItemId}-${i.size}` === key ? { ...i, quantity: action.quantity } : i,
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: number, size: string | null) => void;
  updateQty: (menuItemId: number, size: string | null, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "tata_pizza_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] }, () => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? (JSON.parse(saved) as CartState) : { items: [] };
    } catch {
      return { items: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state));
  }, [state]);

  const total = state.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        total,
        itemCount,
        addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
        removeItem: (menuItemId, size) => dispatch({ type: "REMOVE_ITEM", menuItemId, size }),
        updateQty: (menuItemId, size, quantity) => dispatch({ type: "UPDATE_QTY", menuItemId, size, quantity }),
        clear: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
