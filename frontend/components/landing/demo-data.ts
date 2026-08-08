import type { AggregateMetrics, Metrics } from "@/lib/types/api"

export const demoReviewMetrics: Metrics = {
  speed: 9,
  stability: 8,
  turning: 9,
  customizability: 7,
  value: 8,
}

export const demoReview = {
  cubeName: "RS3 M 2021",
  cubeBrand: "MoYu",
  cubeType: "3x3",
  username: "cornercutter",
  writtenContent:
    "Snappy turns with almost no lockups after a light lube. Corner cutting is generous, and it stays controllable in longer solves. One of the best budget mains I’ve used.",
  overall: 8.2,
  metrics: demoReviewMetrics,
}

export const demoLeaderboard = [
  {
    rank: 1,
    name: "WRM v10",
    brand: "Weilong",
    score: 9.1,
    reviews: 128,
  },
  {
    rank: 2,
    name: "Gan 15 MagLev",
    brand: "GAN",
    score: 8.9,
    reviews: 96,
  },
  {
    rank: 3,
    name: "RS3 M 2021",
    brand: "MoYu",
    score: 8.6,
    reviews: 214,
  },
  {
    rank: 4,
    name: "Tornado V4",
    brand: "QiYi",
    score: 8.4,
    reviews: 77,
  },
  {
    rank: 5,
    name: "Super RS3 M",
    brand: "MoYu",
    score: 8.2,
    reviews: 63,
  },
] as const

export const demoCompareLeft: AggregateMetrics = {
  speed: 9.2,
  stability: 7.8,
  turning: 9.0,
  customizability: 8.5,
  value: 7.0,
  overall: 8.3,
}

export const demoCompareRight: AggregateMetrics = {
  speed: 8.1,
  stability: 9.0,
  turning: 8.4,
  customizability: 6.5,
  value: 9.2,
  overall: 8.2,
}

export const demoCompare = {
  left: {
    name: "WRM v10",
    brand: "Weilong",
    metrics: demoCompareLeft,
  },
  right: {
    name: "RS3 M 2021",
    brand: "MoYu",
    metrics: demoCompareRight,
  },
} as const
