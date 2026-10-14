import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "./App.css";
import Navbar from "./Navbar";
import SmartBudgetting from "./SmartBudgetting";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import CariHarga from "./CariHarga";
import KomparasiPasar from "./KomparasiPasar";
import DetailKios from "./DetailKios";
import { getKomoditas, getPasar, getKomparasiPasar, getTrenHarga } from "./api";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Store,
  MapPin,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  Calculator,
  X,
  ChevronRight,
  BarChart3,
  Sparkles,
  ArrowUpDown,
  Grid,
  List,
  Minus,
} from "lucide-react";

// ================= CONSTANTS & DATA AWAL =================

const CATEGORIES = [
  { label: "Semua Komoditas" },
  { label: "Beras & Padi", categoryKey: "KEBUTUHAN POKOK" },
  { label: "Bumbu Dapur & Cabai", categoryKey: "BUMBU DAPUR" },
  { label: "Minyak & Mentega", categoryKey: "MINYAK GORENG" },
  { label: "Daging, Unggas & Ikan", categoryKey: "PROTEIN HEWANI" },
  { label: "Bawang & Sayuran", categoryKey: "PRODUKSI DAERAH" },
  { label: "Gula & Bahan Baku", categoryKey: "BAHAN BAKU" },
];

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "Beras Medium IR-64",
    category: "KEBUTUHAN POKOK",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat & Sidoharjo",
    price: 12800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 400",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 12800, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 12900, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 13000, note: "Normal" },
      { market: "Pasar Brondong", price: 13100, note: "Pesisir" },
      { market: "Pasar Mantup", price: 13200, note: "Tertinggi" },
    ],
  },
  {
    id: 2,
    name: "Beras Premium Pandan Wangi",
    category: "KEBUTUHAN POKOK",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 15300,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 15300, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 15500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 15600, note: "Normal" },
      { market: "Pasar Brondong", price: 15800, note: "Normal" },
      { market: "Pasar Mantup", price: 16000, note: "Tertinggi" },
    ],
  },
  {
    id: 3,
    name: "Beras Ramos",
    category: "KEBUTUHAN POKOK",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 14800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 500",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 14800, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 15000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 15100, note: "Normal" },
      { market: "Pasar Mantup", price: 15300, note: "Tertinggi" },
    ],
  },
  {
    id: 4,
    name: "Cabai Rawit Merah",
    category: "BUMBU DAPUR",
    badge: "Termurah di Pasar Babat",
    badgeType: "volatile",
    market: "Pasar Babat & Blawi",
    price: 42000,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 6.500",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 42000, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 44000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 46500, note: "Normal" },
      { market: "Pasar Brondong", price: 47500, note: "Normal" },
      { market: "Pasar Mantup", price: 48500, note: "Tertinggi" },
    ],
  },
  {
    id: 5,
    name: "Cabai Merah Keriting",
    category: "BUMBU DAPUR",
    badge: "Termurah di Pasar Babat",
    badgeType: "volatile",
    market: "Pasar Babat",
    price: 41800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 6.700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 41800, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 43500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 45000, note: "Normal" },
      { market: "Pasar Mantup", price: 47000, note: "Normal" },
      { market: "Pasar Sukodadi", price: 48500, note: "Tertinggi" },
    ],
  },
  {
    id: 6,
    name: "Bawang Merah Allium",
    category: "PRODUKSI DAERAH",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 27500,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 1.500",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 27500, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 28000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 28200, note: "Normal" },
      { market: "Pasar Brondong", price: 28600, note: "Normal" },
      { market: "Pasar Mantup", price: 29000, note: "Tertinggi" },
    ],
  },
  {
    id: 7,
    name: "Bawang Putih Honan",
    category: "BUMBU DAPUR",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 35800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 2.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 35800, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 36500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 37000, note: "Normal" },
      { market: "Pasar Mantup", price: 38000, note: "Tertinggi" },
    ],
  },
  {
    id: 8,
    name: "Minyak Goreng Sawit",
    category: "MINYAK GORENG",
    badge: "Sesuai HET Nasional",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 15700,
    unit: "/liter",
    deltaText: "Hemat s/d Rp 1.800",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 15700, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 15900, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 16200, note: "Normal" },
      { market: "Pasar Mantup", price: 16800, note: "Normal" },
      { market: "Pasar Sukodadi", price: 17500, note: "Tertinggi" },
    ],
  },
  {
    id: 9,
    name: "Minyak Goreng Curah",
    category: "MINYAK GORENG",
    badge: "Termurah di Pasar Babat",
    badgeType: "stable",
    market: "Pasar Babat",
    price: 15000,
    unit: "/liter",
    deltaText: "Hemat s/d Rp 1.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 15000, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 15200, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 15500, note: "Normal" },
      { market: "Pasar Mantup", price: 16200, note: "Tertinggi" },
    ],
  },
  {
    id: 10,
    name: "Daging Ayam Broiler",
    category: "PROTEIN HEWANI",
    badge: "Termurah di Pasar Babat",
    badgeType: "stable",
    market: "Pasar Babat & Sidoharjo",
    price: 33800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 5.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 33800, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 34000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 35000, note: "Normal" },
      { market: "Pasar Mantup", price: 36500, note: "Normal" },
      { market: "Pasar Sukodadi", price: 39000, note: "Tertinggi" },
    ],
  },
  {
    id: 11,
    name: "Daging Sapi Murni",
    category: "PROTEIN HEWANI",
    badge: "Termurah di Pasar Babat",
    badgeType: "stable",
    market: "Pasar Babat & Sidoharjo",
    price: 119800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 5.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 119800, note: "Paling Hemat" },
      { market: "Pasar Sidoharjo", price: 120000, note: "Normal" },
      { market: "Pasar Agrobis Babat", price: 121000, note: "Normal" },
      { market: "Pasar Mantup", price: 123000, note: "Normal" },
      { market: "Pasar Brondong", price: 125000, note: "Tertinggi" },
    ],
  },
  {
    id: 12,
    name: "Telur Ayam Ras",
    category: "PROTEIN HEWANI",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 28300,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 1.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 28300, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 28500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 28700, note: "Normal" },
      { market: "Pasar Mantup", price: 29200, note: "Normal" },
      { market: "Pasar Sukodadi", price: 29500, note: "Tertinggi" },
    ],
  },
  {
    id: 13,
    name: "Ikan Bandeng Segar",
    category: "PROTEIN HEWANI",
    badge: "Termurah di Pasar Babat & Brondong",
    badgeType: "stable",
    market: "Pasar Babat",
    price: 31800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 3.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 31800, note: "Paling Hemat" },
      { market: "Pasar Brondong", price: 32000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 33500, note: "Normal" },
      { market: "Pasar Mantup", price: 35000, note: "Tertinggi" },
    ],
  },
  {
    id: 14,
    name: "Ikan Tongkol Segar",
    category: "PROTEIN HEWANI",
    badge: "Termurah di Pasar Babat & Brondong",
    badgeType: "stable",
    market: "Pasar Babat",
    price: 30800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 3.200",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 30800, note: "Paling Hemat" },
      { market: "Pasar Brondong", price: 31000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 32500, note: "Normal" },
      { market: "Pasar Mantup", price: 34000, note: "Tertinggi" },
    ],
  },
  {
    id: 15,
    name: "Gula Pasir Kristal",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat & Sidoharjo",
    price: 17300,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 17300, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 17500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 17600, note: "Normal" },
      { market: "Pasar Mantup", price: 18000, note: "Tertinggi" },
    ],
  },
  {
    id: 16,
    name: "Gula Pasir Curah",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Babat",
    badgeType: "stable",
    market: "Pasar Babat",
    price: 17800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 17800, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 18000, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 18200, note: "Normal" },
      { market: "Pasar Mantup", price: 18500, note: "Tertinggi" },
    ],
  },
  {
    id: 17,
    name: "Gula Aren",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 19800,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 1.700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 19800, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 20500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 21000, note: "Normal" },
      { market: "Pasar Mantup", price: 21500, note: "Tertinggi" },
    ],
  },
  {
    id: 18,
    name: "Tepung Terigu Segitiga",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 11300,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 700",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 11300, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 11500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 11700, note: "Normal" },
      { market: "Pasar Mantup", price: 12000, note: "Tertinggi" },
    ],
  },
  {
    id: 19,
    name: "Kedelai Impor Kuning",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Babat",
    badgeType: "stable",
    market: "Pasar Babat",
    price: 12600,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 600",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Babat", price: 12600, note: "Paling Hemat" },
      { market: "Pasar Agrobis Babat", price: 12800, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 13000, note: "Normal" },
      { market: "Pasar Mantup", price: 13200, note: "Tertinggi" },
    ],
  },
  {
    id: 20,
    name: "Jagung Pipil Kering",
    category: "BAHAN BAKU",
    badge: "Termurah di Pasar Agrobis",
    badgeType: "stable",
    market: "Pasar Agrobis Babat",
    price: 7300,
    unit: "/kg",
    deltaText: "Hemat s/d Rp 500",
    deltaType: "down",
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800&auto=format&fit=crop",
    marketPrices: [
      { market: "Pasar Agrobis Babat", price: 7300, note: "Paling Hemat" },
      { market: "Pasar Babat", price: 7500, note: "Normal" },
      { market: "Pasar Sidoharjo", price: 7600, note: "Normal" },
      { market: "Pasar Mantup", price: 7800, note: "Tertinggi" },
    ],
  },
];

const COMMODITY_TREND_CONFIG = {
  "Beras Medium IR-64": {
    category: "Kebutuhan Pokok",
    todayPrice: 13000,
    unit: "kilogram",
    het: 13000,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Babat & Pasar Sidoharjo",
    insight: "Harga Beras Medium IR-64 terpantau stabil berkat pasokan memadai dari Bulog Lamongan serta kelancaran distribusi beras panen lokal Babat & Sukodadi.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 12800 },
      { day: "Sel", date: "16 Sep", price: 12850 },
      { day: "Rab", date: "17 Sep", price: 12900 },
      { day: "Kam", date: "18 Sep", price: 12950 },
      { day: "Jum", date: "19 Sep", price: 13000 },
      { day: "Sab", date: "20 Sep", price: 13000 },
      { day: "Hari Ini", date: "21 Sep", price: 13000, active: true },
    ],
  },
  "Cabai Rawit Merah Super": {
    category: "Bumbu Dapur",
    todayPrice: 48500,
    unit: "kilogram",
    het: 45000,
    statusHet: "+7.8% di atas HET",
    hetDiff: 3500,
    trendType: "volatile",
    sampleMarket: "Pasar Sidoharjo & Pasar Blimbing",
    insight: "Cabai Rawit Merah mengalami kenaikan bertahap akibat intensitas curah hujan di sentra pertanian, namun stok di pedagang los tetap mencukupi kebutuhan pasar harian.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 46000 },
      { day: "Sel", date: "16 Sep", price: 46500 },
      { day: "Rab", date: "17 Sep", price: 47000 },
      { day: "Kam", date: "18 Sep", price: 48000 },
      { day: "Jum", date: "19 Sep", price: 47500 },
      { day: "Sab", date: "20 Sep", price: 48000 },
      { day: "Hari Ini", date: "21 Sep", price: 48500, active: true },
    ],
  },
  "Minyak Goreng Sawit Kemasan": {
    category: "Minyak Goreng",
    todayPrice: 15700,
    unit: "liter",
    het: 15700,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Babat & Pasar Agrobis",
    insight: "Harga Minyak Goreng (Minyakita) mengalami penurunan bertahap dan kini tepat berada pada HET nasional Rp 15.700 berkat kelancaran distribusi DMO pemerintah.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 16200 },
      { day: "Sel", date: "16 Sep", price: 16100 },
      { day: "Rab", date: "17 Sep", price: 16000 },
      { day: "Kam", date: "18 Sep", price: 15900 },
      { day: "Jum", date: "19 Sep", price: 15800 },
      { day: "Sab", date: "20 Sep", price: 15750 },
      { day: "Hari Ini", date: "21 Sep", price: 15700, active: true },
    ],
  },
  "Bawang Merah Allium": {
    category: "Bumbu Dapur",
    todayPrice: 28000,
    unit: "kilogram",
    het: 28000,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Sidoharjo & Pasar Mantup",
    insight: "Bawang merah terpantau stabil dengan tren menurun seiring masuknya pasokan panen raya dari sentra Nganjuk & Bojonegoro ke pasar-pasar rakyat Lamongan.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 29000 },
      { day: "Sel", date: "16 Sep", price: 28800 },
      { day: "Rab", date: "17 Sep", price: 28500 },
      { day: "Kam", date: "18 Sep", price: 28300 },
      { day: "Jum", date: "19 Sep", price: 28200 },
      { day: "Sab", date: "20 Sep", price: 28000 },
      { day: "Hari Ini", date: "21 Sep", price: 28000, active: true },
    ],
  },
  "Telur Ayam Ras Pilihan": {
    category: "Protein Hewani",
    todayPrice: 28500,
    unit: "kilogram",
    het: 28500,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Agrobis Babat & Sidoharjo",
    insight: "Telur ayam ras terpantau stabil sesuai batas HET. Fluktuasi harga pakan ternak diimbangi efisiensi rantai pasok langsung dari peternak lokal Lamongan.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 28000 },
      { day: "Sel", date: "16 Sep", price: 28100 },
      { day: "Rab", date: "17 Sep", price: 28200 },
      { day: "Kam", date: "18 Sep", price: 28400 },
      { day: "Jum", date: "19 Sep", price: 28400 },
      { day: "Sab", date: "20 Sep", price: 28500 },
      { day: "Hari Ini", date: "21 Sep", price: 28500, active: true },
    ],
  },
  "Daging Ayam Broiler": {
    category: "Protein Hewani",
    todayPrice: 34000,
    unit: "kilogram",
    het: 34000,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Babat & Pasar Sukodadi",
    insight: "Daging ayam broiler segar berada di rentang normal HET nasional dengan pasokan harian peternak lokal Lamongan mencapai rata-rata 3,2 ton per hari.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 33000 },
      { day: "Sel", date: "16 Sep", price: 33200 },
      { day: "Rab", date: "17 Sep", price: 33500 },
      { day: "Kam", date: "18 Sep", price: 33800 },
      { day: "Jum", date: "19 Sep", price: 34000 },
      { day: "Sab", date: "20 Sep", price: 34000 },
      { day: "Hari Ini", date: "21 Sep", price: 34000, active: true },
    ],
  },
  "Daging Sapi Murni": {
    category: "Protein Hewani",
    todayPrice: 120000,
    unit: "kilogram",
    het: 120000,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Babat & Sidoharjo",
    insight: "Harga daging sapi paha belakang kualitas super sangat konsisten dan stabil di angka Rp 120.000/kg tanpa perubahan harga dalam sebulan terakhir.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 120000 },
      { day: "Sel", date: "16 Sep", price: 120000 },
      { day: "Rab", date: "17 Sep", price: 120000 },
      { day: "Kam", date: "18 Sep", price: 120000 },
      { day: "Jum", date: "19 Sep", price: 120000 },
      { day: "Sab", date: "20 Sep", price: 120000 },
      { day: "Hari Ini", date: "21 Sep", price: 120000, active: true },
    ],
  },
  "Gula Pasir Kristal Putih": {
    category: "Bahan Baku",
    todayPrice: 17500,
    unit: "kilogram",
    het: 17500,
    statusHet: "Sesuai HET",
    hetDiff: 0,
    trendType: "stable",
    sampleMarket: "Pasar Babat & Blawi",
    insight: "Gula pasir kristal putih tebu terpantau stabil pada patokan HET pemerintah dengan ketersediaan stok mencukupi di gudang distributor daerah.",
    basePoints7: [
      { day: "Sen", date: "15 Sep", price: 17500 },
      { day: "Sel", date: "16 Sep", price: 17500 },
      { day: "Rab", date: "17 Sep", price: 17400 },
      { day: "Kam", date: "18 Sep", price: 17500 },
      { day: "Jum", date: "19 Sep", price: 17500 },
      { day: "Sab", date: "20 Sep", price: 17500 },
      { day: "Hari Ini", date: "21 Sep", price: 17500, active: true },
    ],
  },
};

function getTrendData(commodityName, timeframe = "7 Hari") {
  const cfg = COMMODITY_TREND_CONFIG[commodityName] || COMMODITY_TREND_CONFIG["Beras Medium IR-64"];
  const numDays = timeframe === "30 Hari" ? 30 : timeframe === "14 Hari" ? 14 : 7;
  
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  
  let seed = 0;
  for (let i = 0; i < commodityName.length; i++) seed += commodityName.charCodeAt(i);

  const now = new Date();
  const points = [];
  const targetPrice = cfg.todayPrice;
  const varianceFactor = cfg.trendType === "volatile" ? 0.045 : 0.015;

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayStr = i === 0 ? "Hari Ini" : dayNames[d.getDay()];
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    const fullDayStr = i === 0 ? "Hari Ini" : `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`;

    let price;
    if (i === 0) {
      price = targetPrice;
    } else if (numDays === 7 && cfg.basePoints7 && cfg.basePoints7[7 - 1 - i]) {
      price = cfg.basePoints7[7 - 1 - i].price;
    } else {
      const progress = (numDays - i) / numDays;
      const wave = Math.sin((i + seed) * 0.72) * (targetPrice * varianceFactor);
      const isNegative = cfg.basePoints7 && cfg.basePoints7[0].price > targetPrice;
      const slope = (isNegative ? -1 : 1) * (targetPrice * varianceFactor * 0.9);
      const baseAtDay = targetPrice - (1 - progress) * slope;
      price = Math.round((baseAtDay + wave * (1 - progress * 0.35)) / 100) * 100;
    }

    points.push({
      index: numDays - 1 - i,
      day: dayStr,
      fullDay: fullDayStr,
      date: dateStr,
      price: price,
      active: i === 0,
      market: cfg.sampleMarket,
    });
  }

  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      points[i].delta = 0;
      points[i].deltaText = "Awal Periode";
      points[i].deltaType = "flat";
    } else {
      const diff = points[i].price - points[i - 1].price;
      points[i].delta = diff;
      if (diff > 0) {
        points[i].deltaText = `+Rp ${diff.toLocaleString("id-ID")}`;
        points[i].deltaType = "up";
      } else if (diff < 0) {
        points[i].deltaText = `-Rp ${Math.abs(diff).toLocaleString("id-ID")}`;
        points[i].deltaType = "down";
      } else {
        points[i].deltaText = "Stabil";
        points[i].deltaType = "flat";
      }
    }
  }

  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const startPrice = points[0].price;
  const overallDiff = targetPrice - startPrice;
  const overallPct = startPrice > 0 ? ((overallDiff / startPrice) * 100).toFixed(1) : 0;

  let deltaText = "Stabil (0.0%)";
  let deltaType = "flat";
  if (overallDiff > 0) {
    deltaText = `+Rp ${overallDiff.toLocaleString("id-ID")} (+${overallPct}%)`;
    deltaType = "up";
  } else if (overallDiff < 0) {
    deltaText = `-Rp ${Math.abs(overallDiff).toLocaleString("id-ID")} (${overallPct}%)`;
    deltaType = "down";
  }

  return {
    ...cfg,
    name: commodityName,
    points,
    minPrice,
    maxPrice,
    avgPrice,
    deltaText,
    deltaType,
    timeframe,
  };
}

const COMMODITY_IMAGES = {
  beras: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=800&auto=format&fit=crop",
  cabai: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?q=80&w=800&auto=format&fit=crop",
  minyak: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop",
  telur: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?q=80&w=800&auto=format&fit=crop",
  ayam: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=800&auto=format&fit=crop",
  sapi: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800&auto=format&fit=crop",
  bawang: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=800&auto=format&fit=crop",
  gula: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?q=80&w=800&auto=format&fit=crop",
  jagung: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=800&auto=format&fit=crop",
  ikan: "https://images.unsplash.com/photo-1534482421-64566f976cfa?q=80&w=800&auto=format&fit=crop",
  tepung: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop",
  kedelai: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=800&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop",
};

function getCommodityImage(name) {
  const lower = (name || "").toLowerCase();
  for (const [key, url] of Object.entries(COMMODITY_IMAGES)) {
    if (key !== "default" && lower.includes(key)) return url;
  }
  return COMMODITY_IMAGES.default;
}

const MARKETS_LIST = [
  { name: "Pasar Babat", address: "Jl. Raya Babat No. 45, Babat, Lamongan" },
  { name: "Pasar Sidoharjo", address: "Jl. Sukomulyo No. 12, Sidoharjo, Lamongan" },
  { name: "Pasar Agrobis Babat", address: "Kawasan Agrobisnis Babat, Lamongan" },
  { name: "Pasar Mantup", address: "Jl. Raya Mantup, Kec. Mantup, Lamongan" },
  { name: "Pasar Brondong", address: "Kawasan Pesisir Pelabuhan Brondong, Lamongan" },
];

function formatRupiah(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + Number(amount).toLocaleString("id-ID");
}

// ================= APP MAIN COMPONENT =================
export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [marketsList, setMarketsList] = useState(MARKETS_LIST);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Komoditas");
  const [selectedMarketFilter, setSelectedMarketFilter] = useState("Semua Pasar");
  const [sortOption, setSortOption] = useState("default");

  const [activePage, setActivePage] = useState("dashboard"); // 'dashboard' | 'cari-harga' | 'login' | 'admin-dashboard' | 'smart-budgeting'
  const [selectedKios, setSelectedKios] = useState(null);

  const [viewMode, setViewMode] = useState("grid");
  const [trendCommodityName, setTrendCommodityName] = useState("Beras Medium IR-64");
  const [timeframe, setTimeframe] = useState("7 Hari");
  const [compareProduct, setCompareProduct] = useState(null);
  const [isMarketDirectoryOpen, setIsMarketDirectoryOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const [liveTrendData, setLiveTrendData] = useState(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Ambil Data Asli dari Backend FastAPI
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getKomoditas().catch(() => null),
      getPasar().catch(() => null),
      getKomparasiPasar().catch(() => null),
    ]).then(([komoditasRes, pasarRes, komparasiRes]) => {
      if (!isMounted) return;

      // 1. Data Titik Pantau Pasar
      if (pasarRes && pasarRes.data && Array.isArray(pasarRes.data) && pasarRes.data.length > 0) {
        const pList = pasarRes.data.map((p) => ({
          name: p.nama_pasar,
          address: p.alamat || `${p.nama_pasar}, Kec. ${p.kecamatan || "Lamongan"}, Lamongan`,
        }));
        setMarketsList(pList);
      }

      // 2. Data Komparasi Antar Pasar -> Samakan 100% ke Katalog Komoditas Dashboard Beranda
      const komparasiItems = komparasiRes?.data || komparasiRes?.komoditas || [];
      if (Array.isArray(komparasiItems) && komparasiItems.length > 0) {
        const formattedProducts = komparasiItems.map((item, idx) => {
          const pricesMap = item.prices || {};
          const marketEntries = Object.entries(pricesMap).map(([mName, mPrice]) => ({
            market: mName,
            price: mPrice,
            note: mPrice === item.minPrice ? "Paling Hemat" : (mPrice === item.maxPrice ? "Tertinggi" : "Normal"),
          }));

          const selisih = item.selisih || 0;
          const deltaText = selisih > 0 ? `Hemat s/d Rp ${selisih.toLocaleString("id-ID")}` : "Harga Stabil";
          const deltaType = item.trend === "down" ? "down" : (selisih > 1000 ? "down" : "flat");

          return {
            id: item.id || (idx + 1),
            name: item.komoditas,
            category: (item.kategori || "KEBUTUHAN POKOK").toUpperCase(),
            badge: item.termurah ? `Termurah di ${item.termurah}` : (item.het && item.minPrice <= item.het ? "Sesuai HET" : "Harga Stabil"),
            badgeType: "stable",
            market: item.termurah ? `${item.termurah} & pasar lain` : "Semua Pasar Pantau",
            price: item.minPrice || item.todayPrice || 12000,
            unit: `/${item.satuan || "kg"}`,
            deltaText: deltaText,
            deltaType: deltaType,
            image: getCommodityImage(item.komoditas),
            marketPrices: marketEntries.length > 0 ? marketEntries : [
              { market: "Pasar Babat", price: item.minPrice || 12000, note: "Paling Hemat" },
              { market: "Pasar Sidoharjo", price: (item.minPrice || 12000) + 500, note: "Normal" }
            ],
          };
        });

        setProducts(formattedProducts);
      } else if (komoditasRes && komoditasRes.data && Array.isArray(komoditasRes.data) && komoditasRes.data.length > 0) {
        const grouped = {};
        komoditasRes.data.forEach((item) => {
          const key = item.nama_bahan;
          if (!grouped[key]) {
            grouped[key] = {
              id: item.id,
              name: item.nama_bahan,
              category: (item.kategori || "KEBUTUHAN POKOK").toUpperCase(),
              badge: item.het && item.harga <= item.het ? "Sesuai HET" : "Harga Stabil",
              badgeType: "stable",
              market: item.lokasi || "Pasar Babat",
              price: item.harga,
              unit: `/${item.satuan || "kg"}`,
              deltaText: item.status_label || "Stabil (0.0%)",
              deltaType: "flat",
              image: getCommodityImage(item.nama_bahan),
              marketPrices: [{ market: item.lokasi || "Pasar Babat", price: item.harga, note: "Paling Hemat" }],
            };
          }
        });
        setProducts(Object.values(grouped));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (selectedCategory !== "Semua Komoditas") {
          const categoryObj = CATEGORIES.find((c) => c.label === selectedCategory);
          if (categoryObj && categoryObj.categoryKey) {
            const pCat = (product.category || "").toUpperCase();
            const targetKey = categoryObj.categoryKey.toUpperCase();
            if (pCat !== targetKey && !pCat.includes(targetKey)) {
              if (targetKey === "PRODUKSI DAERAH" && (pCat.includes("BUMBU") || product.name.toLowerCase().includes("bawang") || product.name.toLowerCase().includes("sayur"))) {
                // allow
              } else if (targetKey === "BAHAN BAKU" && (pCat.includes("SEMBAKO") || product.name.toLowerCase().includes("gula") || product.name.toLowerCase().includes("tepung") || product.name.toLowerCase().includes("jagung") || product.name.toLowerCase().includes("kedelai"))) {
                // allow
              } else if (targetKey === "PROTEIN HEWANI" && (product.name.toLowerCase().includes("ikan") || product.name.toLowerCase().includes("ayam") || product.name.toLowerCase().includes("sapi") || product.name.toLowerCase().includes("telur"))) {
                // allow
              } else {
                return false;
              }
            }
          }
        }

        if (selectedMarketFilter !== "Semua Pasar") {
          if (!product.market.toLowerCase().includes(selectedMarketFilter.toLowerCase())) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === "price-low") return a.price - b.price;
        if (sortOption === "price-high") return b.price - a.price;
        if (sortOption === "name") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchTerm, selectedCategory, selectedMarketFilter, sortOption]);

  useEffect(() => {
    let isMounted = true;
    getTrenHarga(trendCommodityName, timeframe)
      .then((res) => {
        if (isMounted && res && res.data && res.data.points) {
          setLiveTrendData(res.data);
          setIsLiveConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsLiveConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, [trendCommodityName, timeframe, products]);

  const currentTrend = useMemo(() => {
    if (liveTrendData && liveTrendData.name === trendCommodityName && liveTrendData.points?.length) {
      return liveTrendData;
    }
    return getTrendData(trendCommodityName, timeframe);
  }, [liveTrendData, trendCommodityName, timeframe]);

  // 1. Tampilan Login Petugas
  if (activePage === "login" || activePage === "admin-login") {
    return (
      <AdminLogin
        setActivePage={setActivePage}
        onLoginSuccess={() => {
          showToast("Berhasil login sebagai petugas!", "success");
          setActivePage("admin-dashboard");
        }}
        onBackToPublic={() => setActivePage("dashboard")}
      />
    );
  }

  // 2. Tampilan Dashboard Admin / Petugas
  if (activePage === "admin-dashboard") {
    return (
      <AdminDashboard
        setActivePage={setActivePage}
        showToast={showToast}
        products={products}
        setProducts={setProducts}
      />
    );
  }

  // 3. Tampilan Utama (Publik / Smart Budgeting / Cari Harga)
  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast-box">
            <span className="toast-dot"></span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigasi Header */}
      <Navbar activePage={activePage} setActivePage={setActivePage} showToast={showToast} />

      {/* RENDER KONTEN SESUAI ACTIVE PAGE */}
      {activePage === "smart-budgeting" ? (
        <SmartBudgetting
          onBack={() => setActivePage("dashboard")}
          onNavigate={(page) => setActivePage(page)}
        />
      ) : activePage === "cari-harga" ? (
        <CariHarga
          onSelectKios={(kios) => {
            setSelectedKios(kios);
            setActivePage("detail-kios");
          }}
          onNavigate={(page) => setActivePage(page)}
        />
      ) : activePage === "komparasi-pasar" ? (
        <KomparasiPasar setActivePage={setActivePage} />
      ) : activePage === "detail-kios" ? (
        <DetailKios
          kios={selectedKios}
          onBack={() => setActivePage("dashboard")}
          onNavigate={(page) => setActivePage(page)}
        />
      ) : (
        <>
          {/* Hero Section */}
          <section className="hero-wrapper" id="beranda">
            <div className="hero-content">
              <div className="hero-pill">
                <ShieldCheck size={15} />
                <span>SISTEM INFORMASI STABILITAS HARGA PANGAN DAERAH</span>
              </div>
              <h1 className="hero-title">
                Pantau &amp; Bandingkan <span className="gradient-text">Harga Pangan Pokok</span> Terkini di Lamongan
              </h1>
              <p className="hero-desc">
                Akses data fluktuasi komoditas pangan harian dari enumerator resmi Dinas Ketahanan Pangan
                dan Pertanian (DKPP) di 14 pasar rakyat se-Kabupaten Lamongan secara transparan &amp; akurat.
              </p>

              {/* Panel Cari & Filter */}
              <div className="search-command-panel">
                <div className="search-command-row">
                  <div className="search-input-box">
                    <Search size={18} color="var(--slate-400)" />
                    <input
                      type="text"
                      placeholder="Cari komoditas... (contoh: Beras Medium, Cabai Rawit, Minyakita)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} style={{ color: "var(--slate-400)" }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="select-filter-box">
                    <Store size={16} color="var(--primary-700)" />
                    <select
                      value={selectedMarketFilter}
                      onChange={(e) => setSelectedMarketFilter(e.target.value)}
                    >
                      <option value="Semua Pasar">Semua Pasar Rakyat</option>
                      {marketsList.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="select-filter-box">
                    <ArrowUpDown size={16} color="var(--primary-700)" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                      <option value="default">Urutan Default</option>
                      <option value="price-low">Harga Termurah</option>
                      <option value="price-high">Harga Tertinggi</option>
                      <option value="name">Nama Komoditas (A-Z)</option>
                    </select>
                  </div>

                  <button
                    className="btn-search-action"
                    onClick={() => {
                      document.getElementById("katalog-pasar")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Lihat Hasil</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="category-chips-row">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      className={`cat-chip${selectedCategory === cat.label ? " active" : ""}`}
                      onClick={() => setSelectedCategory(cat.label)}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Stats */}
              <div className="hero-stats-row">
                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper">
                    <BarChart3 size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">Rp 13.000</span>
                    <span className="stat-label">Rata-rata Beras IR-64/kg</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper blue">
                    <TrendingDown size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">-0.4%</span>
                    <span className="stat-label">Indeks Inflasi Terkendali</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper amber">
                    <Store size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">Pasar Babat</span>
                    <span className="stat-label">Pasar Terhemat Hari Ini</span>
                  </div>
                </div>

                <div className="hero-stat-card">
                  <div className="stat-icon-wrapper rose">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">14 Pasar Pantau</span>
                    <span className="stat-label">Enumerator Lapangan Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main Layout Content */}
          <main className="main-layout">
            <div className="left-stack">
              {/* Tren Harga */}
              <section className="panel-card" id="tren-harga">
                <div className="panel-header-row">
                  <div>
                    <div className="panel-eyebrow">
                      <BarChart3 size={14} />
                      <span>MONITORING MULTI-TITIK DINAS KETAHANAN PANGAN</span>
                      {isLiveConnected && (
                        <span className="live-db-pill">🟢 Terhubung Database Live</span>
                      )}
                    </div>
                    <h2 className="panel-title">Analisis Tren Fluktuasi Harga Komoditas</h2>
                    <p className="panel-sub">
                      Kurva pergerakan harga <strong>{timeframe}</strong> terakhir berdasarkan sampling harian pedagang los di pasar pantau Lamongan.
                    </p>
                  </div>

                  <div className="trend-controls-row">
                    <div className="select-commodity-btn">
                      <select
                        value={trendCommodityName}
                        onChange={(e) => setTrendCommodityName(e.target.value)}
                      >
                        {Object.keys(COMMODITY_TREND_CONFIG).map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="timeframe-pill-group">
                      {["7 Hari", "14 Hari", "30 Hari"].map((tf) => (
                        <button
                          key={tf}
                          className={`timeframe-btn${timeframe === tf ? " active" : ""}`}
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="price-metric-banner">
                  <div className="price-metric-left">
                    <span className="price-metric-label">Harga Hari Ini ({currentTrend.category}):</span>
                    <div className="price-metric-highlight">
                      <span className="amount">{formatRupiah(currentTrend.todayPrice)}</span>
                      <span className="unit">per {currentTrend.unit}</span>
                      <span className={`price-delta-badge ${currentTrend.deltaType}`}>
                        {currentTrend.deltaType === "up" && <TrendingUp size={13} />}
                        {currentTrend.deltaType === "down" && <TrendingDown size={13} />}
                        {currentTrend.deltaType === "flat" && <Minus size={13} />}
                        <span>{currentTrend.deltaText}</span>
                      </span>
                    </div>
                  </div>

                  <div className="price-metric-stats">
                    <div className="mini-stat">
                      <span className="mini-stat-label">Terendah ({timeframe})</span>
                      <span className="mini-stat-val text-emerald-600">{formatRupiah(currentTrend.minPrice)}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-label">Rata-Rata</span>
                      <span className="mini-stat-val text-slate-700">{formatRupiah(currentTrend.avgPrice)}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-label">Tertinggi ({timeframe})</span>
                      <span className="mini-stat-val text-rose-600">{formatRupiah(currentTrend.maxPrice)}</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-stat-label">Batas HET Acuan</span>
                      <span className="mini-stat-val">
                        {formatRupiah(currentTrend.het)}
                        <span className={`het-pill ${currentTrend.hetDiff > 0 ? "warn" : "ok"}`}>
                          {currentTrend.statusHet}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="chart-container-box">
                  <InteractiveSvgChart
                    dataPoints={currentTrend.points}
                    unit={currentTrend.unit}
                    commodityName={trendCommodityName}
                    timeframe={timeframe}
                  />
                </div>

                {/* AI / DKPP Insight Callout */}
                <div className="insight-callout-box">
                  <Sparkles size={18} className="insight-icon" />
                  <div className="insight-text-content">
                    <strong>Rangkuman Fluktuasi Pasar ({trendCommodityName}):</strong>
                    <p>{currentTrend.insight}</p>
                    <div className="insight-meta-tags">
                      <span className="meta-tag">📍 Sampling: {currentTrend.sampleMarket}</span>
                      <span className="meta-tag">⏱️ Update: Hari ini 06:00 - 10:00 WIB</span>
                      <span className="meta-tag">📊 Sampel: 15 Pedagang Los/Kios</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Katalog Komoditas */}
              <section className="panel-card" id="katalog-pasar">
                <div className="catalog-toolbar">
                  <div>
                    <h2 className="panel-title" style={{ marginBottom: 4 }}>
                      Katalog Komoditas Pangan Populer
                    </h2>
                    <div className="catalog-counter-text">
                      Menampilkan <strong>{filteredProducts.length}</strong> bahan pangan terpantau
                    </div>
                  </div>

                  <div className="view-mode-toggle">
                    <button
                      className={`view-btn${viewMode === "grid" ? " active" : ""}`}
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid size={17} />
                    </button>
                    <button
                      className={`view-btn${viewMode === "list" ? " active" : ""}`}
                      onClick={() => setViewMode("list")}
                    >
                      <List size={17} />
                    </button>
                  </div>
                </div>

                <div className={`commodity-grid ${viewMode === "list" ? "list-view" : ""}`}>
                  {filteredProducts.map((product) => (
                    <CommodityCard
                      key={product.id}
                      product={product}
                      onCompare={(prod) => setCompareProduct(prod)}
                    />
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Right */}
            <aside className="sidebar-stack">
              <div className="sidebar-card-budget">
                <div className="sidebar-badge-new">
                  <Sparkles size={12} />
                  <span>FITUR BARU DKPP</span>
                </div>
                <h3 className="sidebar-card-title">Smart Budgeting Pangan Bulanan</h3>
                <p className="sidebar-card-desc">
                  Rencanakan anggaran belanja bahan dapur keluarga Anda. Dapatkan rekomendasi pasar dengan harga termurah.
                </p>

                <button
                  className="btn-open-calculator"
                  onClick={() => setActivePage("smart-budgeting")}
                >
                  <Calculator size={17} />
                  <span>Buka Halaman Smart Budgeting →</span>
                </button>
              </div>

              <button className="sidebar-action-card" onClick={() => setIsMarketDirectoryOpen(true)}>
                <div className="action-card-icon">
                  <MapPin size={22} />
                </div>
                <div className="action-card-text">
                  <div className="action-card-title">Direktori Pasar</div>
                  <div className="action-card-sub">14 titik pasar tradisional Lamongan</div>
                </div>
                <ChevronRight size={18} />
              </button>
            </aside>
          </main>

          {/* Footer */}
          <footer className="main-footer">
            <div className="footer-bottom-bar">
              <span>© 2026 Pemerintah Kabupaten Lamongan — DKPP.</span>
            </div>
          </footer>
        </>
      )}

      {/* Modal Bandingkan Pasar */}
      {compareProduct && (
        <MarketCompareModal product={compareProduct} onClose={() => setCompareProduct(null)} />
      )}

      {/* Modal Direktori Pasar */}
      {isMarketDirectoryOpen && (
        <MarketDirectoryModal markets={marketsList} onClose={() => setIsMarketDirectoryOpen(false)} />
      )}
    </div>
  );
}

// ================= SUB KOMPONEN LAINNYA =================

function CommodityCard({ product, onCompare }) {
  return (
    <div className="commodity-card">
      <div className="card-thumb-wrap">
        <img src={product.image} alt={product.name} className="card-thumb-img" loading="lazy" />
      </div>

      <div className="card-body">
        <div className="card-cat-label">{product.category}</div>
        <h3 className="card-title">{product.name}</h3>

        <div className="card-market-location">
          <MapPin size={13} color="var(--primary-600)" />
          <span>{product.market}</span>
        </div>

        <div className="card-price-row">
          <span className="card-price-amt">{formatRupiah(product.price)}</span>
          <span className="card-price-unit">{product.unit}</span>
        </div>

        <button className="btn-card-compare" onClick={() => onCompare(product)}>
          <SlidersHorizontal size={14} />
          <span>Bandingkan Pasar</span>
        </button>
      </div>
    </div>
  );
}

function InteractiveSvgChart({ dataPoints, unit, commodityName, timeframe }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const containerRef = useRef(null);

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        Memuat data kurva fluktuasi harga...
      </div>
    );
  }

  const width = 840;
  const height = 280;
  const paddingLeft = 85;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 55;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartBottom = height - paddingBottom;

  const prices = dataPoints.map((d) => d.price);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const diff = rawMax - rawMin;

  const buffer = diff === 0 ? rawMin * 0.05 : Math.max(diff * 0.25, rawMin * 0.02);
  const minPrice = Math.max(0, Math.floor((rawMin - buffer) / 250) * 250);
  const maxPrice = Math.ceil((rawMax + buffer) / 250) * 250;
  const priceRange = maxPrice - minPrice || 1;

  // 4 horizontal grid intervals (5 lines)
  const numGrid = 4;
  const gridTicks = [];
  for (let i = 0; i <= numGrid; i++) {
    const val = minPrice + (priceRange * i) / numGrid;
    const y = chartBottom - (i / numGrid) * chartHeight;
    gridTicks.push({ val: Math.round(val), y });
  }

  const getX = (idx) => paddingLeft + (idx * chartWidth) / (dataPoints.length - 1);
  const getY = (val) => chartBottom - ((val - minPrice) / priceRange) * chartHeight;

  const pointsCoordinates = dataPoints.map((d, i) => ({
    ...d,
    x: getX(i),
    y: getY(d.price),
  }));

  // Smooth Spline (Cubic Bezier)
  const pathD = pointsCoordinates.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const p0 = arr[i - 2] || arr[i - 1];
    const p1 = arr[i - 1];
    const p2 = pt;
    const p3 = arr[i + 1] || pt;
    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;
    return `${acc} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }, "");

  const lastPt = pointsCoordinates[pointsCoordinates.length - 1];
  const firstPt = pointsCoordinates[0];
  const areaD = `${pathD} L ${lastPt.x},${chartBottom} L ${firstPt.x},${chartBottom} Z`;

  // Determine active point to highlight
  const activePt =
    hoveredIndex !== null && pointsCoordinates[hoveredIndex]
      ? pointsCoordinates[hoveredIndex]
      : pointsCoordinates[pointsCoordinates.length - 1];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDist = Infinity;
    pointsCoordinates.forEach((pt, idx) => {
      const dist = Math.abs(pt.x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    setHoveredIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const step = dataPoints.length > 20 ? 4 : dataPoints.length > 10 ? 2 : 1;

  return (
    <div
      ref={containerRef}
      className="chart-interactive-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative" }}
    >
      {/* Floating Tooltip Card */}
      {activePt && (
        <div className="chart-tooltip-floating">
          <div className="tooltip-header">
            <span>{activePt.fullDay}</span>
            <span>{activePt.date}</span>
          </div>
          <div className="tooltip-price-row">
            <span className="tooltip-price-amt">{formatRupiah(activePt.price)}</span>
            <span className="tooltip-price-unit">/{unit || "kg"}</span>
          </div>
          <div className={`tooltip-delta ${activePt.deltaType || "flat"}`}>
            {activePt.deltaType === "up" && "▲ Naik "}
            {activePt.deltaType === "down" && "▼ Turun "}
            {activePt.deltaType === "flat" && "━ "}
            {activePt.deltaText || "Stabil"}
          </div>
          <div className="tooltip-market">📍 {activePt.market || "Pasar Babat & Sidoharjo"}</div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg-interactive">
        <defs>
          <linearGradient id="emeraldTrendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
          <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#059669" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Horizontal Gridlines & Y-Axis Labels */}
        {gridTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={tick.y}
              x2={width - paddingRight}
              y2={tick.y}
              stroke="#e2e8f0"
              strokeDasharray={i === 0 ? "none" : "4 4"}
              strokeWidth={i === 0 ? "1.5" : "1"}
            />
            <text
              x={paddingLeft - 12}
              y={tick.y + 4}
              textAnchor="end"
              fill="#64748b"
              fontSize="11"
              fontWeight="600"
            >
              {formatRupiah(tick.val)}
            </text>
          </g>
        ))}

        {/* Area Fill */}
        <path d={areaD} fill="url(#emeraldTrendGradient)" />

        {/* Main Spline Curve */}
        <path
          d={pathD}
          fill="none"
          stroke="#059669"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadowFilter)"
        />

        {/* Vertical Crosshair Line for Active Hover */}
        {activePt && (
          <line
            x1={activePt.x}
            y1={paddingTop}
            x2={activePt.x}
            y2={chartBottom}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Data Points */}
        {pointsCoordinates.map((pt, i) => {
          const isHovered = hoveredIndex === i;
          const isToday = pt.active;
          return (
            <g key={i}>
              {(isHovered || isToday) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 10 : 8}
                  fill="rgba(16, 185, 129, 0.28)"
                  stroke="#059669"
                  strokeWidth="1.5"
                  className={isToday && !isHovered ? "pulse-halo" : ""}
                />
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : isToday ? 5 : 4}
                fill={isHovered ? "#047857" : "#059669"}
                stroke="#ffffff"
                strokeWidth={isHovered ? "3" : "2"}
                className="chart-point-marker"
              />
              {/* Invisible touch/click hit area */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={16}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(i)}
              />
            </g>
          );
        })}

        {/* X-Axis Baseline & Date Labels */}
        <line
          x1={paddingLeft}
          y1={chartBottom}
          x2={width - paddingRight}
          y2={chartBottom}
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {pointsCoordinates.map((pt, i) => {
          const isToday = pt.active;
          const shouldShow = i % step === 0 || isToday || i === pointsCoordinates.length - 1;
          if (!shouldShow) return null;

          return (
            <g key={`lbl-${i}`}>
              <line
                x1={pt.x}
                y1={chartBottom}
                x2={pt.x}
                y2={chartBottom + 5}
                stroke="#94a3b8"
                strokeWidth="1"
              />
              <text
                x={pt.x}
                y={chartBottom + 18}
                textAnchor="middle"
                fill={isToday ? "#059669" : "#64748b"}
                fontSize={isToday ? "11.5" : "11"}
                fontWeight={isToday ? "800" : "600"}
              >
                {pt.day}
              </text>
              <text
                x={pt.x}
                y={chartBottom + 31}
                textAnchor="middle"
                fill={isToday ? "#047857" : "#94a3b8"}
                fontSize="10"
                fontWeight={isToday ? "700" : "500"}
              >
                {pt.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MarketCompareModal({ product, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Perbandingan Harga Antar Pasar</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            Harga komoditas <strong>{product.name}</strong> di beberapa pasar Lamongan:
          </p>
          <ul>
            {product.marketPrices?.map((m, idx) => (
              <li key={idx}>
                {m.market}: <strong>{formatRupiah(m.price)}</strong> ({m.note})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MarketDirectoryModal({ markets, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Direktori Pasar Rakyat</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {markets.map((m, idx) => (
            <div key={idx} style={{ marginBottom: "12px" }}>
              <strong>{m.name}</strong> - {m.address}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}