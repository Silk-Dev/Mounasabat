export type User = {
  id: string;
  email: string;
  name?: string;
};

export type Event = {
  id: string;
  name: string;
  date: Date;
  location: string;
};

export type Pricing = {
  id: string;
  name: string;
  price: number;
  currency: string;
};
