// file: app/register/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";
type Step = "approval" | "info" | "otp";

type NrcItem = {
  id: string;
  name_en: string;
  name_mm: string;
  nrc_code: string;
  city_mm?: string;
};

const OTP_LENGTH = 6;
const mmDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];

// Add your full NRC JSON data here
const INLINE_NRC_DATA = [
      {
         "id": "1",
         "name_en": "AhGaYa",
         "name_mm": "အဂယ",
         "nrc_code": "1",
         "city_mm": "အင်ဂျန်းယန်"
      },
      {
         "id": "2",
         "name_en": "BaMaNa",
         "name_mm": "ဗမန",
         "nrc_code": "1",
         "city_mm": "ဗန်းမော်"
      },
      {
         "id": "3",
         "name_en": "KhaPhaNa",
         "name_mm": "ခဖန",
         "nrc_code": "1",
         "city_mm": "ချီဖွေ"
      },
      {
         "id": "4",
         "name_en": "DaPhaYa",
         "name_mm": "ဒဖယ",
         "nrc_code": "1",
         "city_mm": "ဒေါ့ဖုန်းယန်"
      },
      {
         "id": "5",
         "name_en": "HaPaNa",
         "name_mm": "ဟပန",
         "nrc_code": "1",
         "city_mm": "ဟိုပင်"
      },
      {
         "id": "6",
         "name_en": "KaMaNa",
         "name_mm": "ကမန",
         "nrc_code": "1",
         "city_mm": "ကာမီ"
      },
      {
         "id": "7",
         "name_en": "KhaLaPha",
         "name_mm": "ခလဖ",
         "nrc_code": "1",
         "city_mm": "ခေါင်လန်ဖူး"
      },
      {
         "id": "8",
         "name_en": "LaGaNa",
         "name_mm": "လဂန",
         "nrc_code": "1",
         "city_mm": "လွယ်ဂျယ်"
      },
      {
         "id": "9",
         "name_en": "MaKhaBa",
         "name_mm": "မခဘ",
         "nrc_code": "1",
         "city_mm": "မချမ်းဘော"
      },
      {
         "id": "10",
         "name_en": "MaSaNa",
         "name_mm": "မစန",
         "nrc_code": "1",
         "city_mm": "မံစီ"
      },
      {
         "id": "11",
         "name_en": "MaNyaNa",
         "name_mm": "မညန",
         "nrc_code": "1",
         "city_mm": "မိုးညင်း"
      },
      {
         "id": "12",
         "name_en": "MaKaTa",
         "name_mm": "မကတ",
         "nrc_code": "1",
         "city_mm": "မိုးကောင်း"
      },
      {
         "id": "13",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "1",
         "city_mm": "မိုးမောက်"
      },
      {
         "id": "14",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "1",
         "city_mm": "မြစ်ကြီးနား"
      },
      {
         "id": "15",
         "name_en": "NaMaNa",
         "name_mm": "နမန",
         "nrc_code": "1",
         "city_mm": "နောင်မွန်း"
      },
      {
         "id": "16",
         "name_en": "PhaKaNa",
         "name_mm": "ဖကန",
         "nrc_code": "1",
         "city_mm": "ဖားကန့်"
      },
      {
         "id": "17",
         "name_en": "PaTaAh",
         "name_mm": "ပတအ",
         "nrc_code": "1",
         "city_mm": "ပူတာအို"
      },
      {
         "id": "18",
         "name_en": "YaKaNa",
         "name_mm": "ရကန",
         "nrc_code": "1",
         "city_mm": "ရွှေကူ"
      },
      {
         "id": "19",
         "name_en": "SaBaNa",
         "name_mm": "ဆဘန",
         "nrc_code": "1",
         "city_mm": "ဆင်ဘို"
      },
      {
         "id": "20",
         "name_en": "SaLaNa",
         "name_mm": "ဆလန",
         "nrc_code": "1",
         "city_mm": "ဆော့လော"
      },
      {
         "id": "21",
         "name_en": "SaPaBa",
         "name_mm": "ဆပဘ",
         "nrc_code": "1",
         "city_mm": "ဆွမ်ပရာဘွမ်"
      },
      {
         "id": "22",
         "name_en": "TaNaNa",
         "name_mm": "တနန",
         "nrc_code": "1",
         "city_mm": "တနိုင်း"
      },
      {
         "id": "23",
         "name_en": "WaMaNa",
         "name_mm": "ဝမန",
         "nrc_code": "1",
         "city_mm": "ဝင်းမော်"
      },
      {
         "id": "357",
         "name_en": "KaMaTa",
         "name_mm": "ကမတ",
         "nrc_code": "1",
         "city_mm": "ကာမိုင်း"
      },
      {
         "id": "358",
         "name_en": "KaPaTa",
         "name_mm": "ကပတ",
         "nrc_code": "1",
         "city_mm": "ကန်ပိုက်တီ"
      },
      {
         "id": "359",
         "name_en": "MaLaNa",
         "name_mm": "မလန",
         "nrc_code": "1",
         "city_mm": "မြို့လှ"
      },
      {
         "id": "360",
         "name_en": "PaNaDa",
         "name_mm": "ပနဒ",
         "nrc_code": "1",
         "city_mm": "ပန်နန်းဒင်"
      },
      {
         "id": "361",
         "name_en": "PaWaNa",
         "name_mm": "ပဝန",
         "nrc_code": "1",
         "city_mm": "ပန်ဝါ"
      },
      {
         "id": "362",
         "name_en": "SaDaNa",
         "name_mm": "ဆဒန",
         "nrc_code": "1",
         "city_mm": "ဆဒုံး"
      },
      {
         "id": "363",
         "name_en": "YaBaYa",
         "name_mm": "ရဘယ",
         "nrc_code": "1",
         "city_mm": "ရှင်ဘွေယန်"
      },
      {
         "id": "24",
         "name_en": "BaLaKha",
         "name_mm": "ဘလခ",
         "nrc_code": "2",
         "city_mm": "ဘော်လခဲ"
      },
      {
         "id": "25",
         "name_en": "DaMaSa",
         "name_mm": "ဒမဆ",
         "nrc_code": "2",
         "city_mm": "ဒီမောဆိုး"
      },
      {
         "id": "26",
         "name_en": "LaKaNa",
         "name_mm": "လကန",
         "nrc_code": "2",
         "city_mm": "လွိုင်ကော်"
      },
      {
         "id": "27",
         "name_en": "MaSaNa",
         "name_mm": "မဆန",
         "nrc_code": "2",
         "city_mm": "မယ်ဆည်နန်"
      },
      {
         "id": "28",
         "name_en": "PhaSaNa",
         "name_mm": "ဖဆန",
         "nrc_code": "2",
         "city_mm": "ဖားဆောင်း"
      },
      {
         "id": "29",
         "name_en": "PhaYaSa",
         "name_mm": "ဖရဆ",
         "nrc_code": "2",
         "city_mm": "ဖရူးဆိုး"
      },
      {
         "id": "30",
         "name_en": "YaTaNa",
         "name_mm": "ရတန",
         "nrc_code": "2",
         "city_mm": "ရှားတော်"
      },
      {
         "id": "364",
         "name_en": "MaSaNa",
         "name_mm": "မစန",
         "nrc_code": "2",
         "city_mm": "မယ်စဲ့"
      },
      {
         "id": "365",
         "name_en": "YaThaNa",
         "name_mm": "ရသန",
         "nrc_code": "2",
         "city_mm": "ရွာသစ်"
      },
      {
         "id": "31",
         "name_en": "LaBaNa",
         "name_mm": "လဘန",
         "nrc_code": "3",
         "city_mm": "လှိုင်းဘွဲ့"
      },
      {
         "id": "32",
         "name_en": "KaKaYa",
         "name_mm": "ကကရ",
         "nrc_code": "3",
         "city_mm": "ကော့ကရိတ်"
      },
      {
         "id": "33",
         "name_en": "KaSaKa",
         "name_mm": "ကဆက",
         "nrc_code": "3",
         "city_mm": "ကြာအင်းဆိပ်ကြီး"
      },
      {
         "id": "34",
         "name_en": "KaDaNa",
         "name_mm": "ကဒန",
         "nrc_code": "3",
         "city_mm": "ကျုံဒိုး"
      },
      {
         "id": "35",
         "name_en": "MaWaTa",
         "name_mm": "မဝတ",
         "nrc_code": "3",
         "city_mm": "မြဝတီ"
      },
      {
         "id": "36",
         "name_en": "PhaAhNa",
         "name_mm": "ဖအန",
         "nrc_code": "3",
         "city_mm": "ဖားအံ"
      },
      {
         "id": "37",
         "name_en": "BaAhNa",
         "name_mm": "ဘအန",
         "nrc_code": "3",
         "city_mm": "ဘားအံ"
      },
      {
         "id": "38",
         "name_en": "PhaPaNa",
         "name_mm": "ဖပန",
         "nrc_code": "3",
         "city_mm": "ဖျာပွန်"
      },
      {
         "id": "39",
         "name_en": "ThaTaNa",
         "name_mm": "သတန",
         "nrc_code": "3",
         "city_mm": "သံတောင်"
      },
      {
         "id": "366",
         "name_en": "BaGaLa",
         "name_mm": "ဘဂလ",
         "nrc_code": "3",
         "city_mm": "ဘောဂလိ"
      },
      {
         "id": "367",
         "name_en": "BaThaSa",
         "name_mm": "ဘသဆ",
         "nrc_code": "3",
         "city_mm": "ဘုရားသုံးဆူ"
      },
      {
         "id": "368",
         "name_en": "KaMaMa",
         "name_mm": "ကမမ",
         "nrc_code": "3",
         "city_mm": "ကမမောင်း"
      },
      {
         "id": "369",
         "name_en": "LaThaNa",
         "name_mm": "လသန",
         "nrc_code": "3",
         "city_mm": "လိပ်သို"
      },
      {
         "id": "370",
         "name_en": "SaKaLa",
         "name_mm": "စကလ",
         "nrc_code": "3",
         "city_mm": "စုကလိ"
      },
      {
         "id": "371",
         "name_en": "ThaTaKa",
         "name_mm": "သတက",
         "nrc_code": "3",
         "city_mm": "သံတောင်ကြီး"
      },
      {
         "id": "372",
         "name_en": "WaLaMa",
         "name_mm": "ဝလမ",
         "nrc_code": "3",
         "city_mm": "ဝေါလေမြိုင်"
      },
      {
         "id": "373",
         "name_en": "YaYaTha",
         "name_mm": "ရရသ",
         "nrc_code": "3",
         "city_mm": "ရှမ်းရွာသစ်"
      },
      {
         "id": "40",
         "name_en": "HaKhaNa",
         "name_mm": "ဟခန",
         "nrc_code": "4",
         "city_mm": "ဟားခါး"
      },
      {
         "id": "41",
         "name_en": "HtaTaLa",
         "name_mm": "ထတလ",
         "nrc_code": "4",
         "city_mm": "ထန်တလန်"
      },
      {
         "id": "42",
         "name_en": "KaPaLa",
         "name_mm": "ကပလ",
         "nrc_code": "4",
         "city_mm": "ကန်ပက်လက်"
      },
      {
         "id": "43",
         "name_en": "MaTaPa",
         "name_mm": "မတပ",
         "nrc_code": "4",
         "city_mm": "မတူပီ"
      },
      {
         "id": "44",
         "name_en": "MaTaNa",
         "name_mm": "မတန",
         "nrc_code": "4",
         "city_mm": "မင်းတပ်"
      },
      {
         "id": "45",
         "name_en": "PhaLaNa",
         "name_mm": "ဖလန",
         "nrc_code": "4",
         "city_mm": "ဖလမ်း"
      },
      {
         "id": "46",
         "name_en": "PaLaWa",
         "name_mm": "ပလဝ",
         "nrc_code": "4",
         "city_mm": "ပလက်ဝ"
      },
      {
         "id": "47",
         "name_en": "TaTaNa",
         "name_mm": "တတန",
         "nrc_code": "4",
         "city_mm": "တီးတိန်"
      },
      {
         "id": "48",
         "name_en": "TaZaNa",
         "name_mm": "တဇန",
         "nrc_code": "4",
         "city_mm": "တွန်းဇံ"
      },
      {
         "id": "374",
         "name_en": "KaKhaNa",
         "name_mm": "ကခန",
         "nrc_code": "4",
         "city_mm": "ကျီခါး"
      },
      {
         "id": "375",
         "name_en": "SaMaNa",
         "name_mm": "ဆမန",
         "nrc_code": "4",
         "city_mm": "ဆမီး"
      },
      {
         "id": "376",
         "name_en": "YaKhaDa",
         "name_mm": "ရခဒ",
         "nrc_code": "4",
         "city_mm": "ရိဒ်ခေါဒါရ်"
      },
      {
         "id": "377",
         "name_en": "YaZaNa",
         "name_mm": "ရဇန",
         "nrc_code": "4",
         "city_mm": "ရေဇွာ"
      },
      {
         "id": "49",
         "name_en": "AhYaTa",
         "name_mm": "အရတ",
         "nrc_code": "5",
         "city_mm": "အရာတော်"
      },
      {
         "id": "50",
         "name_en": "BaMaNa",
         "name_mm": "ဗမန",
         "nrc_code": "5",
         "city_mm": "ဗန်းမောက်"
      },
      {
         "id": "51",
         "name_en": "BaTaLa",
         "name_mm": "ဘတလ",
         "nrc_code": "5",
         "city_mm": "ဘုတလင်"
      },
      {
         "id": "52",
         "name_en": "KhaOuNa",
         "name_mm": "ခဥန",
         "nrc_code": "5",
         "city_mm": "ချောင်းဦး"
      },
      {
         "id": "53",
         "name_en": "DaPaYa",
         "name_mm": "ဒပယ",
         "nrc_code": "5",
         "city_mm": "ဒီပဲယင်း"
      },
      {
         "id": "54",
         "name_en": "HaMaLa",
         "name_mm": "ဟမလ",
         "nrc_code": "5",
         "city_mm": "ဟုမ္မလင်း"
      },
      {
         "id": "55",
         "name_en": "HtaKhaNa",
         "name_mm": "ထခန",
         "nrc_code": "5",
         "city_mm": "ထီးချိုင့်"
      },
      {
         "id": "56",
         "name_en": "AhTaNa",
         "name_mm": "အတန",
         "nrc_code": "5",
         "city_mm": "အင်းတော်"
      },
      {
         "id": "57",
         "name_en": "KaNaNa",
         "name_mm": "ကနန",
         "nrc_code": "5",
         "city_mm": "ကနီ"
      },
      {
         "id": "58",
         "name_en": "KaThaNa",
         "name_mm": "ကသန",
         "nrc_code": "5",
         "city_mm": "ကသာ"
      },
      {
         "id": "59",
         "name_en": "KaLaHta",
         "name_mm": "ကလထ",
         "nrc_code": "5",
         "city_mm": "ကလေး"
      },
      {
         "id": "60",
         "name_en": "KaLaWa",
         "name_mm": "ကလဝ",
         "nrc_code": "5",
         "city_mm": "ကလေးဝ"
      },
      {
         "id": "61",
         "name_en": "KaBaLa",
         "name_mm": "ကဘန",
         "nrc_code": "5",
         "city_mm": "ကန့်ဘလူ"
      },
      {
         "id": "62",
         "name_en": "KaLaTa",
         "name_mm": "ကလတ",
         "nrc_code": "5",
         "city_mm": "ကောလင်း"
      },
      {
         "id": "63",
         "name_en": "KhaTaNa",
         "name_mm": "ခတန",
         "nrc_code": "5",
         "city_mm": "ခန္တီး"
      },
      {
         "id": "64",
         "name_en": "KhaOuTa",
         "name_mm": "ခဥတ",
         "nrc_code": "5",
         "city_mm": "ခင်ဦး"
      },
      {
         "id": "65",
         "name_en": "KaLaNa",
         "name_mm": "ကလန",
         "nrc_code": "5",
         "city_mm": "ကျွန်းလှ"
      },
      {
         "id": "66",
         "name_en": "MaLaNa",
         "name_mm": "မလန",
         "nrc_code": "5",
         "city_mm": "မော်လိုက်"
      },
      {
         "id": "67",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "5",
         "city_mm": "မင်းကင်း"
      },
      {
         "id": "68",
         "name_en": "MaYaNa",
         "name_mm": "မရန",
         "nrc_code": "5",
         "city_mm": "မုံရွာ"
      },
      {
         "id": "69",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "5",
         "city_mm": "မြောင်"
      },
      {
         "id": "70",
         "name_en": "NaYaNa",
         "name_mm": "နယန",
         "nrc_code": "5",
         "city_mm": "နန်းယွန်း"
      },
      {
         "id": "71",
         "name_en": "NgaZaNa",
         "name_mm": "ငဇန",
         "nrc_code": "5",
         "city_mm": "ငါးန်ဇွန်"
      },
      {
         "id": "72",
         "name_en": "PaLaNa",
         "name_mm": "ပလန",
         "nrc_code": "5",
         "city_mm": "ပုလဲ"
      },
      {
         "id": "73",
         "name_en": "PhaPaNa",
         "name_mm": "ဖပန",
         "nrc_code": "5",
         "city_mm": "ဖောင်ပျင်း"
      },
      {
         "id": "74",
         "name_en": "PaLanBa",
         "name_mm": "ပလဘ",
         "nrc_code": "5",
         "city_mm": "ပင်လယ်ဘူး"
      },
      {
         "id": "75",
         "name_en": "SaKaNa",
         "name_mm": "စကန",
         "nrc_code": "5",
         "city_mm": "စစ်ကိုင်း"
      },
      {
         "id": "76",
         "name_en": "SaLaKa",
         "name_mm": "ဆလက",
         "nrc_code": "5",
         "city_mm": "ဆားလင်းကြီး"
      },
      {
         "id": "77",
         "name_en": "YaBaNa",
         "name_mm": "ရဘန",
         "nrc_code": "5",
         "city_mm": "ရွှေဘို"
      },
      {
         "id": "78",
         "name_en": "TaMaNa",
         "name_mm": "တမန",
         "nrc_code": "5",
         "city_mm": "တမူး"
      },
      {
         "id": "79",
         "name_en": "TaSaNa",
         "name_mm": "တဆန",
         "nrc_code": "5",
         "city_mm": "တန့်ဆည်"
      },
      {
         "id": "80",
         "name_en": "WaLaNa",
         "name_mm": "ဝလန",
         "nrc_code": "5",
         "city_mm": "ဝက်လက်"
      },
      {
         "id": "81",
         "name_en": "WaThaNa",
         "name_mm": "ဝသန",
         "nrc_code": "5",
         "city_mm": "ဝမ်းသို"
      },
      {
         "id": "82",
         "name_en": "YaOuNa",
         "name_mm": "ရဥန",
         "nrc_code": "5",
         "city_mm": "ရေဦး"
      },
      {
         "id": "83",
         "name_en": "YaMaPa",
         "name_mm": "ယမပ",
         "nrc_code": "5",
         "city_mm": "ယင်းမာပင်"
      },
      {
         "id": "84",
         "name_en": "YaThaKa",
         "name_mm": "ရသက",
         "nrc_code": "5",
         "city_mm": "ရွာသစ်ကြီး"
      },
      {
         "id": "378",
         "name_en": "DaHaNa",
         "name_mm": "ဒဟန",
         "nrc_code": "5",
         "city_mm": "ဒုံဟီး"
      },
      {
         "id": "379",
         "name_en": "SaMaYa",
         "name_mm": "ဆမရ",
         "nrc_code": "5",
         "city_mm": "ဆွမ္မရာ"
      },
      {
         "id": "380",
         "name_en": "HtaPaKha",
         "name_mm": "ထပခ",
         "nrc_code": "5",
         "city_mm": "ထန်ပါခွေ"
      },
      {
         "id": "381",
         "name_en": "KaMaNa",
         "name_mm": "ကမန",
         "nrc_code": "5",
         "city_mm": "ကျောက်မြောင်း"
      },
      {
         "id": "382",
         "name_en": "KhaPaNa",
         "name_mm": "ခပန",
         "nrc_code": "5",
         "city_mm": "ခမ်းပတ်"
      },
      {
         "id": "383",
         "name_en": "LaHaNa",
         "name_mm": "လဟန",
         "nrc_code": "5",
         "city_mm": "လဟယ်"
      },
      {
         "id": "384",
         "name_en": "LaYaNa",
         "name_mm": "လရန",
         "nrc_code": "5",
         "city_mm": "လေရှီး"
      },
      {
         "id": "385",
         "name_en": "MaMaNa",
         "name_mm": "မမတ",
         "nrc_code": "5",
         "city_mm": "မြင်းမူ"
      },
      {
         "id": "386",
         "name_en": "MaPaLa",
         "name_mm": "မပလ",
         "nrc_code": "5",
         "city_mm": "မိုပိုင်းလွတ်"
      },
      {
         "id": "387",
         "name_en": "MaThaNa",
         "name_mm": "မသန",
         "nrc_code": "5",
         "city_mm": "မြို့သစ်"
      },
      {
         "id": "388",
         "name_en": "PaSaNa",
         "name_mm": "ပဆန",
         "nrc_code": "5",
         "city_mm": "ပန်ဆောင်"
      },
      {
         "id": "85",
         "name_en": "BaPaNa",
         "name_mm": "ဘပန",
         "nrc_code": "6",
         "city_mm": "ဘုတ်ပြင်း"
      },
      {
         "id": "86",
         "name_en": "HtaWaNa",
         "name_mm": "ထဝန",
         "nrc_code": "6",
         "city_mm": "ထားဝယ်"
      },
      {
         "id": "87",
         "name_en": "KaThaNa",
         "name_mm": "ကသန",
         "nrc_code": "6",
         "city_mm": "ကော့သောင်း"
      },
      {
         "id": "88",
         "name_en": "KaSaNa",
         "name_mm": "ကစန",
         "nrc_code": "6",
         "city_mm": "ကျွန်းစု"
      },
      {
         "id": "89",
         "name_en": "LaLaNa",
         "name_mm": "လလန",
         "nrc_code": "6",
         "city_mm": "လောင်းလုံ"
      },
      {
         "id": "90",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "6",
         "city_mm": "မြိတ်"
      },
      {
         "id": "91",
         "name_en": "MaAhYa",
         "name_mm": "မအရ",
         "nrc_code": "6",
         "city_mm": "မြိတ်အရှေ့"
      },
      {
         "id": "92",
         "name_en": "NgaYaKa",
         "name_mm": "ငရက",
         "nrc_code": "6",
         "city_mm": "ငရုတ်ကောင်း"
      },
      {
         "id": "93",
         "name_en": "PaLaNa",
         "name_mm": "ပလန",
         "nrc_code": "6",
         "city_mm": "ပုလော"
      },
      {
         "id": "94",
         "name_en": "TaNaTha",
         "name_mm": "တနသ",
         "nrc_code": "6",
         "city_mm": "တနသာၤရီ"
      },
      {
         "id": "95",
         "name_en": "TaThaYa",
         "name_mm": "တသရ",
         "nrc_code": "6",
         "city_mm": "တနသာၤရီ"
      },
      {
         "id": "96",
         "name_en": "ThaYaKha",
         "name_mm": "သရခ",
         "nrc_code": "6",
         "city_mm": "သရက်ချောင်း"
      },
      {
         "id": "97",
         "name_en": "YaPhaNa",
         "name_mm": "ရဖန",
         "nrc_code": "6",
         "city_mm": "ရေဖြူ"
      },
      {
         "id": "356",
         "name_en": "KhaMaKa",
         "name_mm": "ခမက (ခမောက်ကြီး )",
         "nrc_code": "6"
      },
      {
         "id": "389",
         "name_en": "KaLaAh",
         "name_mm": "ကလအ",
         "nrc_code": "6",
         "city_mm": "ကလိန်အောင်"
      },
      {
         "id": "390",
         "name_en": "KaYaYa",
         "name_mm": "ကရရ",
         "nrc_code": "6",
         "city_mm": "ကရသူရိ"
      },
      {
         "id": "391",
         "name_en": "MaAhNa",
         "name_mm": "မအန",
         "nrc_code": "6",
         "city_mm": "မြိတ်အနောက်"
      },
      {
         "id": "392",
         "name_en": "PaKaMa",
         "name_mm": "ပကမ",
         "nrc_code": "6",
         "city_mm": "ပြည်ကြီးမဏ္ဍိုင်"
      },
      {
         "id": "393",
         "name_en": "PaLaTa",
         "name_mm": "ပလတ",
         "nrc_code": "6",
         "city_mm": "ပလောက်"
      },
      {
         "id": "427",
         "name_en": "MaTaNa",
         "name_mm": "မတန",
         "nrc_code": "6",
         "city_mm": "မေတ္တာမြို့နယ်ခွဲ"
      },
      {
         "id": "98",
         "name_en": "AhPhaNa",
         "name_mm": "အဖန",
         "nrc_code": "7",
         "city_mm": "အုတ်ဖို"
      },
      {
         "id": "99",
         "name_en": "AhPhaNa",
         "name_mm": "အဖန",
         "nrc_code": "7",
         "city_mm": "အုတ်ဖြတ်"
      },
      {
         "id": "100",
         "name_en": "AhTaNa",
         "name_mm": "အတန",
         "nrc_code": "7",
         "city_mm": "အုတ်တွင်း"
      },
      {
         "id": "101",
         "name_en": "DaOuNa",
         "name_mm": "ဒဥန",
         "nrc_code": "7",
         "city_mm": "ဒိုက်ဦး"
      },
      {
         "id": "102",
         "name_en": "HtaTaPa",
         "name_mm": "ထတပ",
         "nrc_code": "7",
         "city_mm": "ထန်းတပင်"
      },
      {
         "id": "103",
         "name_en": "KaTaTa",
         "name_mm": "ကတတ",
         "nrc_code": "7",
         "city_mm": "ကေတုမတီ"
      },
      {
         "id": "104",
         "name_en": "KaPaKa",
         "name_mm": "ကပက",
         "nrc_code": "7",
         "city_mm": "ကြို့ပင်ကောက်"
      },
      {
         "id": "105",
         "name_en": "KaKaNa",
         "name_mm": "ကကန",
         "nrc_code": "7",
         "city_mm": "ကျောက်ကြီး"
      },
      {
         "id": "106",
         "name_en": "KaTaKha",
         "name_mm": "ကတခ",
         "nrc_code": "7",
         "city_mm": "ကျောက်တံခါး"
      },
      {
         "id": "107",
         "name_en": "KaKaNa",
         "name_mm": "ကကန",
         "nrc_code": "7",
         "city_mm": "ကျောက်ကုန်း"
      },
      {
         "id": "108",
         "name_en": "MaDaNa",
         "name_mm": "မဒန",
         "nrc_code": "7",
         "city_mm": "မဒေါက်"
      },
      {
         "id": "109",
         "name_en": "MaLaNa",
         "name_mm": "မလန",
         "nrc_code": "7",
         "city_mm": "မင်းလှ"
      },
      {
         "id": "110",
         "name_en": "MaNyaNa",
         "name_mm": "မညန",
         "nrc_code": "7",
         "city_mm": "မိုးညို"
      },
      {
         "id": "111",
         "name_en": "NaTaLa",
         "name_mm": "နတလ",
         "nrc_code": "7",
         "city_mm": "နတ်တလင်း"
      },
      {
         "id": "112",
         "name_en": "NyaLaPa",
         "name_mm": "ညလပ",
         "nrc_code": "7",
         "city_mm": "ညောင်လေးပင်"
      },
      {
         "id": "113",
         "name_en": "PaNaKa",
         "name_mm": "ပနက",
         "nrc_code": "7",
         "city_mm": "ပဲနွယ်ကုန်း"
      },
      {
         "id": "114",
         "name_en": "PaKhaNa",
         "name_mm": "ပခန",
         "nrc_code": "7",
         "city_mm": "ပဲခူး"
      },
      {
         "id": "115",
         "name_en": "PaTaNa",
         "name_mm": "ပတန",
         "nrc_code": "7",
         "city_mm": "ပန်တောင်း"
      },
      {
         "id": "116",
         "name_en": "PaKhaTa",
         "name_mm": "ပခန",
         "nrc_code": "7",
         "city_mm": "ပေါက်ခေါင်း"
      },
      {
         "id": "117",
         "name_en": "PaTaTa",
         "name_mm": "ပတတ",
         "nrc_code": "7",
         "city_mm": "ပေါင်းတည်"
      },
      {
         "id": "118",
         "name_en": "PhaMaNa",
         "name_mm": "ဖမန",
         "nrc_code": "7",
         "city_mm": "ဖြူး"
      },
      {
         "id": "119",
         "name_en": "PaMaNa",
         "name_mm": "ပမန",
         "nrc_code": "7",
         "city_mm": "ပြည်"
      },
      {
         "id": "120",
         "name_en": "PaTaSa",
         "name_mm": "ပတစ",
         "nrc_code": "7",
         "city_mm": "ပြွန်တဆာ"
      },
      {
         "id": "121",
         "name_en": "YaKaNa",
         "name_mm": "ရကန",
         "nrc_code": "7",
         "city_mm": "ရွှေကျင်"
      },
      {
         "id": "122",
         "name_en": "YaTaNa",
         "name_mm": "ရတန",
         "nrc_code": "7",
         "city_mm": "ရွှေတောင်"
      },
      {
         "id": "123",
         "name_en": "TaNgaNa",
         "name_mm": "တငန",
         "nrc_code": "7",
         "city_mm": "တောင်ငူ"
      },
      {
         "id": "124",
         "name_en": "ThaNaPa",
         "name_mm": "သနပ",
         "nrc_code": "7",
         "city_mm": "သနပ်ပင်"
      },
      {
         "id": "125",
         "name_en": "ThaKaNa",
         "name_mm": "သကန",
         "nrc_code": "7",
         "city_mm": "သဲကုန်း"
      },
      {
         "id": "126",
         "name_en": "ThaWaTa",
         "name_mm": "သဝတ",
         "nrc_code": "7",
         "city_mm": "သာယာဝတီ"
      },
      {
         "id": "127",
         "name_en": "ThaSaNa",
         "name_mm": "သဆန",
         "nrc_code": "7",
         "city_mm": "သုံးဆယ်"
      },
      {
         "id": "128",
         "name_en": "WaMaNa",
         "name_mm": "ဝမန",
         "nrc_code": "7",
         "city_mm": "ဝေါ"
      },
      {
         "id": "129",
         "name_en": "YaTaYa",
         "name_mm": "ရတရ",
         "nrc_code": "7",
         "city_mm": "ရေတာရှည်"
      },
      {
         "id": "130",
         "name_en": "ZaKaNa",
         "name_mm": "ဇကန",
         "nrc_code": "7",
         "city_mm": "ဇီးကုန်း"
      },
      {
         "id": "394",
         "name_en": "KaWaNa",
         "name_mm": "ကဝန",
         "nrc_code": "7",
         "city_mm": "ကဝ"
      },
      {
         "id": "395",
         "name_en": "LaPATa",
         "name_mm": "လပတ",
         "nrc_code": "7",
         "city_mm": "လက်ပံတန်း"
      },
      {
         "id": "396",
         "name_en": "PaTaLa",
         "name_mm": "ပတလ",
         "nrc_code": "7",
         "city_mm": "ပေါင်းတလည်"
      },
      {
         "id": "131",
         "name_en": "AhLaNa",
         "name_mm": "အလန",
         "nrc_code": "8",
         "city_mm": "အောင်လံ"
      },
      {
         "id": "132",
         "name_en": "KhaMaNa",
         "name_mm": "ခမန",
         "nrc_code": "8",
         "city_mm": "ချောက်"
      },
      {
         "id": "133",
         "name_en": "GaGaNa",
         "name_mm": "ဂဂန",
         "nrc_code": "8",
         "city_mm": "ဂန့်ဂေါ"
      },
      {
         "id": "134",
         "name_en": "SaPhaNa",
         "name_mm": "ဆဖန",
         "nrc_code": "8",
         "city_mm": "ဆိပ်ဖြူ"
      },
      {
         "id": "135",
         "name_en": "SaPaWa",
         "name_mm": "ဆပဝ",
         "nrc_code": "8",
         "city_mm": "ဆင်ပေါင်ဝဲ"
      },
      {
         "id": "136",
         "name_en": "HtaLaNa",
         "name_mm": "ထလန",
         "nrc_code": "8",
         "city_mm": "ထီးလင်း"
      },
      {
         "id": "137",
         "name_en": "KaMaNa",
         "name_mm": "ကမန",
         "nrc_code": "8",
         "city_mm": "ကံမ"
      },
      {
         "id": "138",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "8",
         "city_mm": "မကွေး"
      },
      {
         "id": "139",
         "name_en": "MaBaNa",
         "name_mm": "မဘန",
         "nrc_code": "8",
         "city_mm": "မင်းဘူး"
      },
      {
         "id": "140",
         "name_en": "MaLaNa",
         "name_mm": "မလန",
         "nrc_code": "8",
         "city_mm": "မင်းလှ"
      },
      {
         "id": "141",
         "name_en": "MaTaNa",
         "name_mm": "မတန",
         "nrc_code": "8",
         "city_mm": "မင်းတုန်း"
      },
      {
         "id": "142",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "8",
         "city_mm": "မြိုင်"
      },
      {
         "id": "143",
         "name_en": "MaHtaNa",
         "name_mm": "မထန",
         "nrc_code": "8",
         "city_mm": "မြေထဲ"
      },
      {
         "id": "144",
         "name_en": "MaThaNa",
         "name_mm": "မသန",
         "nrc_code": "8",
         "city_mm": "မြို့သစ်"
      },
      {
         "id": "145",
         "name_en": "NaMaNa",
         "name_mm": "နမန",
         "nrc_code": "8",
         "city_mm": "နတ်မောက်"
      },
      {
         "id": "146",
         "name_en": "NgaPhaNa",
         "name_mm": "ငဖန",
         "nrc_code": "8",
         "city_mm": "ငါးဖယ်"
      },
      {
         "id": "147",
         "name_en": "PaKhaKa",
         "name_mm": "ပခက",
         "nrc_code": "8",
         "city_mm": "ပခုက္ကူ"
      },
      {
         "id": "148",
         "name_en": "PaMaNa",
         "name_mm": "ပမန",
         "nrc_code": "8",
         "city_mm": "ပေါက်"
      },
      {
         "id": "149",
         "name_en": "PaPhaNa",
         "name_mm": "ပဖန",
         "nrc_code": "8",
         "city_mm": "ပွင့်ဖြူ"
      },
      {
         "id": "150",
         "name_en": "SaLaNa",
         "name_mm": "စလန",
         "nrc_code": "8",
         "city_mm": "စလင်း"
      },
      {
         "id": "151",
         "name_en": "SaTaYa",
         "name_mm": "စတရ",
         "nrc_code": "8",
         "city_mm": "စေတုတ္တရာ"
      },
      {
         "id": "152",
         "name_en": "SaKaNa",
         "name_mm": "စကန",
         "nrc_code": "8",
         "city_mm": "စကု"
      },
      {
         "id": "153",
         "name_en": "TaTaKa",
         "name_mm": "တတက",
         "nrc_code": "8",
         "city_mm": "တောင်တွင်းကြီး"
      },
      {
         "id": "154",
         "name_en": "ThaYaNa",
         "name_mm": "သရန",
         "nrc_code": "8",
         "city_mm": "သရက်"
      },
      {
         "id": "155",
         "name_en": "SaMaNa",
         "name_mm": "ဆမန",
         "nrc_code": "8",
         "city_mm": "ဆော"
      },
      {
         "id": "156",
         "name_en": "YaNaKha",
         "name_mm": "ရနခ",
         "nrc_code": "8",
         "city_mm": "ရေနံချောင်း"
      },
      {
         "id": "157",
         "name_en": "YaSaKa",
         "name_mm": "ရစက",
         "nrc_code": "8",
         "city_mm": "ရေစကြို"
      },
      {
         "id": "397",
         "name_en": "KaHtaNa",
         "name_mm": "ကထန",
         "nrc_code": "8",
         "city_mm": "ကျောက်ထု"
      },
      {
         "id": "158",
         "name_en": "DaKhaTha",
         "name_mm": "ဒခသ",
         "nrc_code": "9",
         "city_mm": "ဒက္ခိဏသီရိ"
      },
      {
         "id": "159",
         "name_en": "LaWaNa",
         "name_mm": "လဝန",
         "nrc_code": "9",
         "city_mm": "လယ်ဝေး"
      },
      {
         "id": "160",
         "name_en": "OuTaTha",
         "name_mm": "ဥတသ",
         "nrc_code": "9",
         "city_mm": "ဥတ္တရသီရိ"
      },
      {
         "id": "161",
         "name_en": "PaBaTha",
         "name_mm": "ပဗသ",
         "nrc_code": "9",
         "city_mm": "ပုဗ္ဗသီရိ"
      },
      {
         "id": "162",
         "name_en": "PaMaNa",
         "name_mm": "ပမန",
         "nrc_code": "9",
         "city_mm": "ပျဉ်းမနား"
      },
      {
         "id": "163",
         "name_en": "TaKaNa",
         "name_mm": "တကန",
         "nrc_code": "9",
         "city_mm": "တပ်ကုန်း"
      },
      {
         "id": "164",
         "name_en": "ZaBaTha",
         "name_mm": "ဇဗသ",
         "nrc_code": "9",
         "city_mm": "ဇမ္ဗူသီရိ"
      },
      {
         "id": "165",
         "name_en": "ZaYaTha",
         "name_mm": "ဇယသ",
         "nrc_code": "9",
         "city_mm": "ဇေယျာသီရိ"
      },
      {
         "id": "166",
         "name_en": "AhMaYa",
         "name_mm": "အမရ",
         "nrc_code": "9",
         "city_mm": "အမရပူရ"
      },
      {
         "id": "167",
         "name_en": "AhMaZa",
         "name_mm": "အမဇ",
         "nrc_code": "9",
         "city_mm": "အောင်မြေသာဇံ"
      },
      {
         "id": "168",
         "name_en": "KhaAhZa",
         "name_mm": "ခအစ",
         "nrc_code": "9",
         "city_mm": "ချမ်းအေးသာစည်"
      },
      {
         "id": "169",
         "name_en": "KhaMaSa",
         "name_mm": "ခမစ",
         "nrc_code": "9",
         "city_mm": "ချမ်းမြသာစည်"
      },
      {
         "id": "170",
         "name_en": "KaPaTa",
         "name_mm": "ကပတ",
         "nrc_code": "9",
         "city_mm": "ကျောက်ပန်းတောင်း"
      },
      {
         "id": "171",
         "name_en": "KaSaNa",
         "name_mm": "ကဆန",
         "nrc_code": "9",
         "city_mm": "ကျောက်ဆည်"
      },
      {
         "id": "172",
         "name_en": "MaLaNa",
         "name_mm": "မလန",
         "nrc_code": "9",
         "city_mm": "မလိူင်"
      },
      {
         "id": "173",
         "name_en": "MaHaMa",
         "name_mm": "မဟမ",
         "nrc_code": "9",
         "city_mm": "မဟာအောင်မြေ"
      },
      {
         "id": "174",
         "name_en": "MaNaMa",
         "name_mm": "မနမ",
         "nrc_code": "9",
         "city_mm": "မန်းနောက်မြောက်"
      },
      {
         "id": "175",
         "name_en": "MaNaTa",
         "name_mm": "မနတ",
         "nrc_code": "9",
         "city_mm": "မန်းနောက်တောင်"
      },
      {
         "id": "176",
         "name_en": "MaYaMa",
         "name_mm": "မရမ",
         "nrc_code": "9",
         "city_mm": "မန်းရှေ့မြောက်"
      },
      {
         "id": "177",
         "name_en": "MaYaTa",
         "name_mm": "မရတ",
         "nrc_code": "9",
         "city_mm": "မန်းရှေ့တောင်"
      },
      {
         "id": "178",
         "name_en": "MaTaYa",
         "name_mm": "မတရ",
         "nrc_code": "9",
         "city_mm": "မတ္တရာ"
      },
      {
         "id": "179",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "9",
         "city_mm": "မေမြို့"
      },
      {
         "id": "180",
         "name_en": "MaHtaLa",
         "name_mm": "မထလ",
         "nrc_code": "9",
         "city_mm": "မိတ္ထီလာ"
      },
      {
         "id": "181",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "9",
         "city_mm": "မိုးကုတ်"
      },
      {
         "id": "182",
         "name_en": "MaKhaNa",
         "name_mm": "မခန",
         "nrc_code": "9",
         "city_mm": "မြင်းခြံ"
      },
      {
         "id": "183",
         "name_en": "MaThaNa",
         "name_mm": "မသန",
         "nrc_code": "9",
         "city_mm": "မြစ်သား"
      },
      {
         "id": "184",
         "name_en": "NaHtaKa",
         "name_mm": "နထက",
         "nrc_code": "9",
         "city_mm": "နွားထိုးကြီး"
      },
      {
         "id": "185",
         "name_en": "NgaTaYa",
         "name_mm": "ငသရ",
         "nrc_code": "9",
         "city_mm": "င့ါသရောက်"
      },
      {
         "id": "186",
         "name_en": "NyaOuNa",
         "name_mm": "ညဥန",
         "nrc_code": "9",
         "city_mm": "ညောင်ဦး"
      },
      {
         "id": "187",
         "name_en": "PaLaNa",
         "name_mm": "ပလန",
         "nrc_code": "9",
         "city_mm": "ပုလိပ်"
      },
      {
         "id": "188",
         "name_en": "PaThaKa",
         "name_mm": "ပသက",
         "nrc_code": "9",
         "city_mm": "ပုသိမ်ကြီး"
      },
      {
         "id": "189",
         "name_en": "PaBaNa",
         "name_mm": "ပဖန",
         "nrc_code": "9",
         "city_mm": "ပျော်ဖွယ်"
      },
      {
         "id": "190",
         "name_en": "PaKaKha",
         "name_mm": "ပကခ",
         "nrc_code": "9",
         "city_mm": "ပြည်ကြီးတံခွန်"
      },
      {
         "id": "191",
         "name_en": "PaOuLa",
         "name_mm": "ပဥလ",
         "nrc_code": "9",
         "city_mm": "ပြင်ဦးလွင်"
      },
      {
         "id": "192",
         "name_en": "PaMaNa",
         "name_mm": "ပမန",
         "nrc_code": "9",
         "city_mm": "ပျဉ်းမနား"
      },
      {
         "id": "193",
         "name_en": "SaKaTa",
         "name_mm": "စကတ",
         "nrc_code": "9",
         "city_mm": "စဉ့်ကိုင်"
      },
      {
         "id": "194",
         "name_en": "SaKaNa",
         "name_mm": "ဆကန",
         "nrc_code": "9",
         "city_mm": "စဉ့်ကူး"
      },
      {
         "id": "195",
         "name_en": "TaKaNa",
         "name_mm": "တကန",
         "nrc_code": "9",
         "city_mm": "တကောင်း"
      },
      {
         "id": "196",
         "name_en": "TaTaOu",
         "name_mm": "တတဥ",
         "nrc_code": "9",
         "city_mm": "တံတားဦး"
      },
      {
         "id": "197",
         "name_en": "TaThaNa",
         "name_mm": "တသန",
         "nrc_code": "9",
         "city_mm": "တောင်သာ"
      },
      {
         "id": "198",
         "name_en": "ThaPaKa",
         "name_mm": "သပက",
         "nrc_code": "9",
         "city_mm": "သပိတ်ကျင်း"
      },
      {
         "id": "199",
         "name_en": "ThaSaNa",
         "name_mm": "သစန",
         "nrc_code": "9",
         "city_mm": "သာစည်"
      },
      {
         "id": "200",
         "name_en": "WaTaNa",
         "name_mm": "ဝတန",
         "nrc_code": "9",
         "city_mm": "ဝမ်းတွင်း"
      },
      {
         "id": "201",
         "name_en": "YaMaTha",
         "name_mm": "ရမသ",
         "nrc_code": "9",
         "city_mm": "ရမည်းသင်း"
      },
      {
         "id": "398",
         "name_en": "NgaZaNa",
         "name_mm": "ငဇန",
         "nrc_code": "9",
         "city_mm": "ငါန်းဇွန်"
      },
      {
         "id": "399",
         "name_en": "PaBaNa",
         "name_mm": "ပဘန",
         "nrc_code": "9",
         "city_mm": "ပျော်ဘွယ်"
      },
      {
         "id": "400",
         "name_en": "OoTaYa",
         "name_mm": "ဥတသ",
         "nrc_code": "9",
         "city_mm": "ဥတ္တရသီရိ"
      },
      {
         "id": "424",
         "name_en": "KhAaHsa",
         "name_mm": "ခအဇ",
         "nrc_code": "9",
         "city_mm": "ချမ်းအေးသာစံ"
      },
      {
         "id": "202",
         "name_en": "BaLaNa",
         "name_mm": "ဘလန",
         "nrc_code": "10",
         "city_mm": "ဘီးလင်း"
      },
      {
         "id": "203",
         "name_en": "KhaSaNa",
         "name_mm": "ခဆန",
         "nrc_code": "10",
         "city_mm": "ချောင်းဆုံ"
      },
      {
         "id": "204",
         "name_en": "KaMaYa",
         "name_mm": "ကမရ",
         "nrc_code": "10",
         "city_mm": "ကျိုက်မရော"
      },
      {
         "id": "205",
         "name_en": "KaHtaNa",
         "name_mm": "ကထန",
         "nrc_code": "10",
         "city_mm": "ကျိုက်ထို"
      },
      {
         "id": "206",
         "name_en": "MaLaMa",
         "name_mm": "မလမ",
         "nrc_code": "10",
         "city_mm": "မော်လမြိုင်"
      },
      {
         "id": "207",
         "name_en": "MaDaNa",
         "name_mm": "မဒန",
         "nrc_code": "10",
         "city_mm": "မုဒုံ"
      },
      {
         "id": "208",
         "name_en": "PaMaNa",
         "name_mm": "ပမန",
         "nrc_code": "10",
         "city_mm": "ပေါင်"
      },
      {
         "id": "209",
         "name_en": "ThaPhaYa",
         "name_mm": "သဖရ",
         "nrc_code": "10",
         "city_mm": "သံဖြူဇရပ်"
      },
      {
         "id": "210",
         "name_en": "ThaHtaNa",
         "name_mm": "သထန",
         "nrc_code": "10",
         "city_mm": "သထုံ"
      },
      {
         "id": "211",
         "name_en": "KhaZaNa",
         "name_mm": "ခဇန",
         "nrc_code": "10",
         "city_mm": "ခေါဇာ"
      },
      {
         "id": "212",
         "name_en": "LaMaNa",
         "name_mm": "လမန",
         "nrc_code": "10",
         "city_mm": "လမိုင်း"
      },
      {
         "id": "213",
         "name_en": "YaMaNa",
         "name_mm": "ရမန",
         "nrc_code": "10",
         "city_mm": "ရေး"
      },
      {
         "id": "401",
         "name_en": "KaKhaMa",
         "name_mm": "ကခမ",
         "nrc_code": "10",
         "city_mm": "ကျိုက္ခမီ"
      },
      {
         "id": "214",
         "name_en": "AaMaNa",
         "name_mm": "အမန",
         "nrc_code": "11",
         "city_mm": "အမ်း"
      },
      {
         "id": "215",
         "name_en": "BaThaTa",
         "name_mm": "ဘသတ",
         "nrc_code": "11",
         "city_mm": "ဘူးသီးတောင်"
      },
      {
         "id": "216",
         "name_en": "GaMaNa",
         "name_mm": "ဂမန",
         "nrc_code": "11",
         "city_mm": "ဂွ"
      },
      {
         "id": "217",
         "name_en": "KaPhaNa",
         "name_mm": "ကဖန",
         "nrc_code": "11",
         "city_mm": "ကျောက်ဖြူ"
      },
      {
         "id": "218",
         "name_en": "KaTaNa",
         "name_mm": "ကတန",
         "nrc_code": "11",
         "city_mm": "ကျောက်တော်"
      },
      {
         "id": "219",
         "name_en": "MaAhNa",
         "name_mm": "မအန",
         "nrc_code": "11",
         "city_mm": "မာန်အောင်"
      },
      {
         "id": "220",
         "name_en": "MaTaNa",
         "name_mm": "မတန",
         "nrc_code": "11",
         "city_mm": "မောင်းတော"
      },
      {
         "id": "221",
         "name_en": "MaPaNa",
         "name_mm": "မပန",
         "nrc_code": "11",
         "city_mm": "မင်းပြား"
      },
      {
         "id": "222",
         "name_en": "MaOuNa",
         "name_mm": "မဥန",
         "nrc_code": "11",
         "city_mm": "မြောက်ဦး"
      },
      {
         "id": "223",
         "name_en": "MaPaTa",
         "name_mm": "မပတ",
         "nrc_code": "11",
         "city_mm": "မြေပုံ"
      },
      {
         "id": "224",
         "name_en": "PaTaNa",
         "name_mm": "ပတန",
         "nrc_code": "11",
         "city_mm": "ပေါက်တော"
      },
      {
         "id": "225",
         "name_en": "PaNaKa",
         "name_mm": "ပဏက",
         "nrc_code": "11",
         "city_mm": "ပုဏ္ဏကျွန်း"
      },
      {
         "id": "226",
         "name_en": "SaTaNa",
         "name_mm": "စတန",
         "nrc_code": "11",
         "city_mm": "စစ်တွေ"
      },
      {
         "id": "227",
         "name_en": "TaKaNa",
         "name_mm": "တကန",
         "nrc_code": "11",
         "city_mm": "တောင်ကုတ်"
      },
      {
         "id": "228",
         "name_en": "ThaTaNa",
         "name_mm": "သတန",
         "nrc_code": "11",
         "city_mm": "သံတွဲ"
      },
      {
         "id": "229",
         "name_en": "YaBaNa",
         "name_mm": "ရဗန",
         "nrc_code": "11",
         "city_mm": "ရမ်းဗြဲ"
      },
      {
         "id": "230",
         "name_en": "YaThaTa",
         "name_mm": "ရသတ",
         "nrc_code": "11",
         "city_mm": "ရသေ့တောင်"
      },
      {
         "id": "402",
         "name_en": "KaTaLa",
         "name_mm": "ကတလ",
         "nrc_code": "11",
         "city_mm": "ကျိန္တလီ"
      },
      {
         "id": "403",
         "name_en": "MaAhTa",
         "name_mm": "မအတ",
         "nrc_code": "11",
         "city_mm": "မအီ"
      },
      {
         "id": "404",
         "name_en": "TaPaWa",
         "name_mm": "တပဝ",
         "nrc_code": "11",
         "city_mm": "တောင်ပြိုလက်ဝဲ"
      },
      {
         "id": "231",
         "name_en": "AaLaNa",
         "name_mm": "အလန",
         "nrc_code": "12",
         "city_mm": "အလုံ"
      },
      {
         "id": "232",
         "name_en": "BaHaNa",
         "name_mm": "ဗဟန",
         "nrc_code": "12",
         "city_mm": "ဗဟန်း"
      },
      {
         "id": "233",
         "name_en": "BaTaHta",
         "name_mm": "ဗတထ",
         "nrc_code": "12",
         "city_mm": "ဗိုလ်တထောင်"
      },
      {
         "id": "234",
         "name_en": "KaKaKa",
         "name_mm": "ကကက",
         "nrc_code": "12",
         "city_mm": "ကိုကိုးကျွန်း"
      },
      {
         "id": "235",
         "name_en": "DaGaNa",
         "name_mm": "ဒဂန",
         "nrc_code": "12",
         "city_mm": "ဒဂုံ"
      },
      {
         "id": "236",
         "name_en": "DaGaYa",
         "name_mm": "ဒဂရ",
         "nrc_code": "12",
         "city_mm": "ဒဂုံမြို့သစ်(အရှေ့ပိုင်း)"
      },
      {
         "id": "237",
         "name_en": "DaGaMa",
         "name_mm": "ဒဂမ",
         "nrc_code": "12",
         "city_mm": "ဒဂုံမြို့သစ်(မြောက်ပိုင်း)"
      },
      {
         "id": "238",
         "name_en": "DaSaKa",
         "name_mm": "ဒဆက",
         "nrc_code": "12",
         "city_mm": "ဒဂုံမြို့သစ်ဆိပ်ကမ်း"
      },
      {
         "id": "239",
         "name_en": "DaGaTa",
         "name_mm": "ဒဂတ",
         "nrc_code": "12",
         "city_mm": "ဒဂုံမြို့သစ်(တောင်ပိုင်း)"
      },
      {
         "id": "240",
         "name_en": "DaLaNa",
         "name_mm": "ဒလန",
         "nrc_code": "12",
         "city_mm": "ဒလ"
      },
      {
         "id": "241",
         "name_en": "DaPaNa",
         "name_mm": "ဒပန",
         "nrc_code": "12",
         "city_mm": "ဒေါပုံ"
      },
      {
         "id": "242",
         "name_en": "LaMaNa",
         "name_mm": "လမန",
         "nrc_code": "12",
         "city_mm": "လှိုင်"
      },
      {
         "id": "243",
         "name_en": "LaThaYa",
         "name_mm": "လသယ",
         "nrc_code": "12",
         "city_mm": "လှိုင်သာယာ"
      },
      {
         "id": "244",
         "name_en": "LaKaNa",
         "name_mm": "လကန",
         "nrc_code": "12",
         "city_mm": "လှည်းကူး"
      },
      {
         "id": "245",
         "name_en": "MaBaNa",
         "name_mm": "မဘန",
         "nrc_code": "12",
         "city_mm": "မှော်ဘီ"
      },
      {
         "id": "246",
         "name_en": "HtaTaPa",
         "name_mm": "ထတပ",
         "nrc_code": "12",
         "city_mm": "ထန်းတပင်"
      },
      {
         "id": "247",
         "name_en": "AhSaNa",
         "name_mm": "အစန",
         "nrc_code": "12",
         "city_mm": "အင်းစိန်"
      },
      {
         "id": "248",
         "name_en": "KaMaYa",
         "name_mm": "ကမရ",
         "nrc_code": "12",
         "city_mm": "ကမာရွတ်"
      },
      {
         "id": "249",
         "name_en": "KaMaNa",
         "name_mm": "ကမန",
         "nrc_code": "12",
         "city_mm": "ကော့မှုုး"
      },
      {
         "id": "250",
         "name_en": "KhaYaNa",
         "name_mm": "ခရန",
         "nrc_code": "12",
         "city_mm": "ခရမ်း"
      },
      {
         "id": "251",
         "name_en": "KaKhaKa",
         "name_mm": "ကခက",
         "nrc_code": "12",
         "city_mm": "ကွမ်းခြံကုန်း"
      },
      {
         "id": "252",
         "name_en": "KaTaTa",
         "name_mm": "ကတတ",
         "nrc_code": "12",
         "city_mm": "ကျောက်တံတား"
      },
      {
         "id": "253",
         "name_en": "KaTaNa",
         "name_mm": "ကတန",
         "nrc_code": "12",
         "city_mm": "ကျောက်တန်း"
      },
      {
         "id": "254",
         "name_en": "KaMaTa",
         "name_mm": "ကမတ",
         "nrc_code": "12",
         "city_mm": "ကြည့်မြင်တိုင်"
      },
      {
         "id": "255",
         "name_en": "LaMata",
         "name_mm": "လမတ",
         "nrc_code": "12",
         "city_mm": "လမ်းမတော်"
      },
      {
         "id": "256",
         "name_en": "LaThaNa",
         "name_mm": "လသန",
         "nrc_code": "12",
         "city_mm": "လသာ"
      },
      {
         "id": "257",
         "name_en": "MaYaKa",
         "name_mm": "မရက",
         "nrc_code": "12",
         "city_mm": "မရမ်းကုန်း"
      },
      {
         "id": "258",
         "name_en": "MaGaTa",
         "name_mm": "မဂတ",
         "nrc_code": "12",
         "city_mm": "မင်္ဂလာတောင်ညွှန့်"
      },
      {
         "id": "259",
         "name_en": "MaGaDa",
         "name_mm": "မဂဒ",
         "nrc_code": "12",
         "city_mm": "မင်္ဂလာဒုံ"
      },
      {
         "id": "260",
         "name_en": "OuKaMa",
         "name_mm": "ဥကမ",
         "nrc_code": "12",
         "city_mm": "မြောက်ဥက္ကလာပ"
      },
      {
         "id": "261",
         "name_en": "PaBaTa",
         "name_mm": "ပဘတ",
         "nrc_code": "12",
         "city_mm": "ပန်းဘဲတန်း"
      },
      {
         "id": "262",
         "name_en": "PaZaDa",
         "name_mm": "ပဇတ",
         "nrc_code": "12",
         "city_mm": "ပုဇွန်တောင်"
      },
      {
         "id": "263",
         "name_en": "SaKhaNa",
         "name_mm": "စခန",
         "nrc_code": "12",
         "city_mm": "စမ်းချောင်း"
      },
      {
         "id": "264",
         "name_en": "SaKakha",
         "name_mm": "ဆကခ",
         "nrc_code": "12",
         "city_mm": "ဆိပ်ကြီးခနောင်တို"
      },
      {
         "id": "265",
         "name_en": "SaKaNa",
         "name_mm": "ဆကန",
         "nrc_code": "12",
         "city_mm": "ဆိပ်ကမ်း"
      },
      {
         "id": "266",
         "name_en": "YaPaKa",
         "name_mm": "ရပက",
         "nrc_code": "12",
         "city_mm": "ရွှေပေါက်ကံ"
      },
      {
         "id": "267",
         "name_en": "YaPaTha",
         "name_mm": "ရပသ",
         "nrc_code": "12",
         "city_mm": "ရွှေပြည်သာ"
      },
      {
         "id": "268",
         "name_en": "OuKaTa",
         "name_mm": "ဥကတ",
         "nrc_code": "12",
         "city_mm": "တောင်ဥက္ကလာပ"
      },
      {
         "id": "269",
         "name_en": "TaKaNa",
         "name_mm": "တကန",
         "nrc_code": "12",
         "city_mm": "တိုက်ကြီး"
      },
      {
         "id": "270",
         "name_en": "TaMaNa",
         "name_mm": "တမန",
         "nrc_code": "12",
         "city_mm": "တာမွေ"
      },
      {
         "id": "271",
         "name_en": "ThaKaTa",
         "name_mm": "သကတ",
         "nrc_code": "12",
         "city_mm": "သာကေတ"
      },
      {
         "id": "272",
         "name_en": "ThaLaNa",
         "name_mm": "သလန",
         "nrc_code": "12",
         "city_mm": "သန်လျင်"
      },
      {
         "id": "273",
         "name_en": "ThaGaKa",
         "name_mm": "သဃက",
         "nrc_code": "12",
         "city_mm": "သင်္ဃန်းကျွန်း"
      },
      {
         "id": "274",
         "name_en": "ThaKhaNa",
         "name_mm": "သခန",
         "nrc_code": "12",
         "city_mm": "သုံးခွ"
      },
      {
         "id": "275",
         "name_en": "TaTaNa",
         "name_mm": "တတန",
         "nrc_code": "12",
         "city_mm": "တွံတေး"
      },
      {
         "id": "276",
         "name_en": "YaKaNa",
         "name_mm": "ရကန",
         "nrc_code": "12",
         "city_mm": "ရန်ကင်း"
      },
      {
         "id": "426",
         "name_en": "TaTaHta",
         "name_mm": "တတထ (တံတား)",
         "nrc_code": "12"
      },
      {
         "id": "277",
         "name_en": "KhaYaHa",
         "name_mm": "ခရဟ",
         "nrc_code": "13",
         "city_mm": "ချင်းရွှေဟော် မြို့နယ်ခွဲ"
      },
      {
         "id": "278",
         "name_en": "HaPaTa",
         "name_mm": "ဟပတ",
         "nrc_code": "13",
         "city_mm": "ဟိုပန်"
      },
      {
         "id": "279",
         "name_en": "HaPaNa",
         "name_mm": "ဟပန",
         "nrc_code": "13",
         "city_mm": "ဟိုပုံး"
      },
      {
         "id": "280",
         "name_en": "KaLaNa",
         "name_mm": "ကလန",
         "nrc_code": "13",
         "city_mm": "ကလော"
      },
      {
         "id": "281",
         "name_en": "KaLaTa",
         "name_mm": "ကလတ",
         "nrc_code": "13",
         "city_mm": "ကွမ်းလုံ"
      },
      {
         "id": "282",
         "name_en": "KaHaNa",
         "name_mm": "ကဟန",
         "nrc_code": "13",
         "city_mm": "ကွန်ဟိန်း"
      },
      {
         "id": "283",
         "name_en": "KaThaNa",
         "name_mm": "ကသန",
         "nrc_code": "13",
         "city_mm": "ကျေးသီး"
      },
      {
         "id": "284",
         "name_en": "KaTaTa",
         "name_mm": "ကတတ",
         "nrc_code": "13",
         "city_mm": "ကျိုင်းတောင်း"
      },
      {
         "id": "285",
         "name_en": "KaTaNa",
         "name_mm": "ကတန",
         "nrc_code": "13",
         "city_mm": "ကျိုင်းတုံ"
      },
      {
         "id": "286",
         "name_en": "KaMaNa",
         "name_mm": "ကမန",
         "nrc_code": "13",
         "city_mm": "ကျောက်မဲ"
      },
      {
         "id": "287",
         "name_en": "KaKhaNa",
         "name_mm": "ကခန",
         "nrc_code": "13",
         "city_mm": "ကွတ်ခိုင်"
      },
      {
         "id": "288",
         "name_en": "LaYaNa",
         "name_mm": "လရန",
         "nrc_code": "13",
         "city_mm": "လားရှိုး"
      },
      {
         "id": "289",
         "name_en": "LaKaNa",
         "name_mm": "လကန",
         "nrc_code": "13",
         "city_mm": "လောက်ကိုင်"
      },
      {
         "id": "290",
         "name_en": "LaKhaTa",
         "name_mm": "လခတ",
         "nrc_code": "13",
         "city_mm": "လဲချား"
      },
      {
         "id": "291",
         "name_en": "LaKhaNa",
         "name_mm": "လခန",
         "nrc_code": "13",
         "city_mm": "လင်းခေး"
      },
      {
         "id": "292",
         "name_en": "LaLaNa",
         "name_mm": "လလန",
         "nrc_code": "13",
         "city_mm": "လွိုင်လင်"
      },
      {
         "id": "293",
         "name_en": "MaBaNa",
         "name_mm": "မဘန",
         "nrc_code": "13",
         "city_mm": "မဘိမ်း"
      },
      {
         "id": "294",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "13",
         "city_mm": "မိုင်းကိုင်"
      },
      {
         "id": "295",
         "name_en": "MaKhaNa",
         "name_mm": "မခန",
         "nrc_code": "13",
         "city_mm": "မိုင်းခတ်"
      },
      {
         "id": "296",
         "name_en": "MaPHaNa",
         "name_mm": "မဖန",
         "nrc_code": "13",
         "city_mm": "မိုင်းဖြတ်"
      },
      {
         "id": "297",
         "name_en": "MaPaTa",
         "name_mm": "မပတ",
         "nrc_code": "13",
         "city_mm": "မိုင်းပြင်း"
      },
      {
         "id": "298",
         "name_en": "MaSaNa",
         "name_mm": "မဆန",
         "nrc_code": "13",
         "city_mm": "မိုင်းဆတ်"
      },
      {
         "id": "299",
         "name_en": "MaYaNa",
         "name_mm": "မရန",
         "nrc_code": "13",
         "city_mm": "မိုင်းရှုး"
      },
      {
         "id": "300",
         "name_en": "MaYaTa",
         "name_mm": "မရတ",
         "nrc_code": "13",
         "city_mm": "မိုင်းရယ်"
      },
      {
         "id": "301",
         "name_en": "MaTaTa",
         "name_mm": "မတတ",
         "nrc_code": "13",
         "city_mm": "မန်တုန်"
      },
      {
         "id": "302",
         "name_en": "MaMaTa",
         "name_mm": "မမတ",
         "nrc_code": "13",
         "city_mm": "မိုးမိတ်"
      },
      {
         "id": "303",
         "name_en": "MaNaNa",
         "name_mm": "မနန",
         "nrc_code": "13",
         "city_mm": "မိုးနဲ"
      },
      {
         "id": "304",
         "name_en": "MaKaNa",
         "name_mm": "မကန",
         "nrc_code": "13",
         "city_mm": "မုန်းကိုး"
      },
      {
         "id": "305",
         "name_en": "MaSaTa",
         "name_mm": "မဆတ",
         "nrc_code": "13",
         "city_mm": "မူဆယ်"
      },
      {
         "id": "306",
         "name_en": "NaMaTa",
         "name_mm": "နမတ",
         "nrc_code": "13",
         "city_mm": "နမ့်မတူ"
      },
      {
         "id": "307",
         "name_en": "NaKhaNa",
         "name_mm": "နခန",
         "nrc_code": "13",
         "city_mm": "နမ့်ခမ်း"
      },
      {
         "id": "308",
         "name_en": "NaSaNa",
         "name_mm": "နဆန",
         "nrc_code": "13",
         "city_mm": "နမ့်ဆန်"
      },
      {
         "id": "309",
         "name_en": "NaPaNa",
         "name_mm": "နဖန",
         "nrc_code": "13",
         "city_mm": "နမ့်ဖိုင်"
      },
      {
         "id": "310",
         "name_en": "NaKhaTa",
         "name_mm": "နခတ",
         "nrc_code": "13",
         "city_mm": "နောင်ချို"
      },
      {
         "id": "311",
         "name_en": "NyaYaNa",
         "name_mm": "ညရန",
         "nrc_code": "13",
         "city_mm": "ညောင်ရွှေ"
      },
      {
         "id": "312",
         "name_en": "PhaKhaNa",
         "name_mm": "ဖခန",
         "nrc_code": "13",
         "city_mm": "ဖယ်ခုံ"
      },
      {
         "id": "313",
         "name_en": "PaLaNa",
         "name_mm": "ပလန",
         "nrc_code": "13",
         "city_mm": "ပင်လုံ"
      },
      {
         "id": "314",
         "name_en": "PaTaYa",
         "name_mm": "ပတရ",
         "nrc_code": "13",
         "city_mm": "ပင်းတယ"
      },
      {
         "id": "315",
         "name_en": "SaSaNa",
         "name_mm": "ဆဆန",
         "nrc_code": "13",
         "city_mm": "ဆီဆိုင်"
      },
      {
         "id": "316",
         "name_en": "YaNyaNa",
         "name_mm": "ရညန",
         "nrc_code": "13",
         "city_mm": "ရွှေညောင်"
      },
      {
         "id": "317",
         "name_en": "TaYaNa",
         "name_mm": "တယန",
         "nrc_code": "13",
         "city_mm": "တန့်ယန်း"
      },
      {
         "id": "318",
         "name_en": "TaMaNya",
         "name_mm": "တမည",
         "nrc_code": "13",
         "city_mm": "တာမိုးညဲ"
      },
      {
         "id": "319",
         "name_en": "TaKhaLa",
         "name_mm": "တခလ",
         "nrc_code": "13",
         "city_mm": "တာချီလိတ်"
      },
      {
         "id": "320",
         "name_en": "TaLaNa",
         "name_mm": "တလန",
         "nrc_code": "13",
         "city_mm": "တာလေ"
      },
      {
         "id": "321",
         "name_en": "TaKaNa",
         "name_mm": "တကန",
         "nrc_code": "13",
         "city_mm": "တောင်ကြီး"
      },
      {
         "id": "322",
         "name_en": "ThaNaNa",
         "name_mm": "သနန",
         "nrc_code": "13",
         "city_mm": "သိန္နီ"
      },
      {
         "id": "323",
         "name_en": "ThaPaNa",
         "name_mm": "သပန",
         "nrc_code": "13",
         "city_mm": "သီပေါ"
      },
      {
         "id": "324",
         "name_en": "YaNgaNa",
         "name_mm": "ရငန",
         "nrc_code": "13",
         "city_mm": "ရွာငံ"
      },
      {
         "id": "325",
         "name_en": "YaSaNa",
         "name_mm": "ရစန",
         "nrc_code": "13",
         "city_mm": "ရပ်စောက်"
      },
      {
         "id": "405",
         "name_en": "AhPaNa",
         "name_mm": "အပန",
         "nrc_code": "13",
         "city_mm": "အောင်ပန်း"
      },
      {
         "id": "406",
         "name_en": "AhTaNa",
         "name_mm": "အတန",
         "nrc_code": "13",
         "city_mm": "အင်တော"
      },
      {
         "id": "407",
         "name_en": "AhTaYa",
         "name_mm": "အသယ",
         "nrc_code": "13",
         "city_mm": "အေးသာယာ"
      },
      {
         "id": "408",
         "name_en": "HaHaNa",
         "name_mm": "ဟဟန",
         "nrc_code": "13",
         "city_mm": "ဟဲဟိုး"
      },
      {
         "id": "409",
         "name_en": "HaMaNa",
         "name_mm": "ဟမန",
         "nrc_code": "13",
         "city_mm": "ဟိုမိန်း"
      },
      {
         "id": "410",
         "name_en": "KaLaHta",
         "name_mm": "ကလထ",
         "nrc_code": "13",
         "city_mm": "ကျိူင်းလပ်"
      },
      {
         "id": "411",
         "name_en": "KaLaNa",
         "name_mm": "ခလန",
         "nrc_code": "13",
         "city_mm": "ခိုလမ်"
      },
      {
         "id": "412",
         "name_en": "MaHtaNa",
         "name_mm": "မထန",
         "nrc_code": "13",
         "city_mm": "မော်ထိုက်"
      },
      {
         "id": "413",
         "name_en": "MaKhaTa",
         "name_mm": "မခတ",
         "nrc_code": "13",
         "city_mm": "မိုင်းခုတ်"
      },
      {
         "id": "414",
         "name_en": "MaNgaNa",
         "name_mm": "မငန",
         "nrc_code": "13",
         "city_mm": "မိုင်းငေါ့"
      },
      {
         "id": "415",
         "name_en": "MaPhaHta",
         "name_mm": "မဖထ",
         "nrc_code": "13",
         "city_mm": "မိုင်းဖျန်"
      },
      {
         "id": "416",
         "name_en": "NaTaYa",
         "name_mm": "နတရ",
         "nrc_code": "13",
         "city_mm": "နောင်တရား"
      },
      {
         "id": "417",
         "name_en": "PaPaKa",
         "name_mm": "ပပက",
         "nrc_code": "13",
         "city_mm": "ပုံပါကျင်"
      },
      {
         "id": "418",
         "name_en": "PaWaNa",
         "name_mm": "ပဝန",
         "nrc_code": "13",
         "city_mm": "ပန်ဝိုင်"
      },
      {
         "id": "419",
         "name_en": "TaTaNa",
         "name_mm": "တတန",
         "nrc_code": "13",
         "city_mm": "တုံတာ"
      },
      {
         "id": "326",
         "name_en": "BaKaLa",
         "name_mm": "ဘကလ",
         "nrc_code": "14",
         "city_mm": "ဘိုကလေး"
      },
      {
         "id": "327",
         "name_en": "DaNaPha",
         "name_mm": "ဓနဖ",
         "nrc_code": "14",
         "city_mm": "ဓနုဖြူ"
      },
      {
         "id": "328",
         "name_en": "DaDaYa",
         "name_mm": "ဒဒရ",
         "nrc_code": "14",
         "city_mm": "ဒေးဒရဲ"
      },
      {
         "id": "329",
         "name_en": "PaThaYa",
         "name_mm": "ပသရ",
         "nrc_code": "14",
         "city_mm": "ပုသိမ်(အရှေ့)"
      },
      {
         "id": "330",
         "name_en": "AhMaNa",
         "name_mm": "အမန",
         "nrc_code": "14",
         "city_mm": "အိမ်မဲ"
      },
      {
         "id": "331",
         "name_en": "HaKaKa",
         "name_mm": "ဟကက",
         "nrc_code": "14",
         "city_mm": "ဟိုင်းကြီးကျွန်း"
      },
      {
         "id": "332",
         "name_en": "HaThaTa",
         "name_mm": "ဟသတ",
         "nrc_code": "14",
         "city_mm": "ဟင်္သာတ"
      },
      {
         "id": "333",
         "name_en": "AhGaPa",
         "name_mm": "အဂပ",
         "nrc_code": "14",
         "city_mm": "အင်္ဂပူ"
      },
      {
         "id": "334",
         "name_en": "KaNaNa",
         "name_mm": "ခနန",
         "nrc_code": "14",
         "city_mm": "ခနောင်"
      },
      {
         "id": "335",
         "name_en": "KaLaNa",
         "name_mm": "ကလန",
         "nrc_code": "14",
         "city_mm": "ကျိုက်လတ်"
      },
      {
         "id": "336",
         "name_en": "KaKhaNa",
         "name_mm": "ကခန",
         "nrc_code": "14",
         "city_mm": "ကြံခင်း"
      },
      {
         "id": "337",
         "name_en": "KaKaNa",
         "name_mm": "ကကန",
         "nrc_code": "14",
         "city_mm": "ကျောင်းကုန်း"
      },
      {
         "id": "338",
         "name_en": "KaPaNa",
         "name_mm": "ကပန",
         "nrc_code": "14",
         "city_mm": "ကျုံပျော်"
      },
      {
         "id": "339",
         "name_en": "LaPaTa",
         "name_mm": "လပတ",
         "nrc_code": "14",
         "city_mm": "လပွတ္တာ"
      },
      {
         "id": "340",
         "name_en": "LaMaNa",
         "name_mm": "လမန",
         "nrc_code": "14",
         "city_mm": "လေးမျက်နှာ"
      },
      {
         "id": "341",
         "name_en": "MaAhPa",
         "name_mm": "မအပ",
         "nrc_code": "14",
         "city_mm": "မအူပင်"
      },
      {
         "id": "342",
         "name_en": "MaMaKa",
         "name_mm": "မမက",
         "nrc_code": "14",
         "city_mm": "မော်လမြိုင်ကျွန်း"
      },
      {
         "id": "343",
         "name_en": "MaAhaNa",
         "name_mm": "မအန",
         "nrc_code": "14",
         "city_mm": "မြန်အောင်"
      },
      {
         "id": "344",
         "name_en": "MaMaNa",
         "name_mm": "မမန",
         "nrc_code": "14",
         "city_mm": "မြောင်းမြ"
      },
      {
         "id": "345",
         "name_en": "NgaPaTa",
         "name_mm": "ငပတ",
         "nrc_code": "14",
         "city_mm": "ငပုတော"
      },
      {
         "id": "346",
         "name_en": "NgaThaKha",
         "name_mm": "ငသခ",
         "nrc_code": "14",
         "city_mm": "ငါးသိုင်းချောင်း"
      },
      {
         "id": "347",
         "name_en": "NyaTaNa",
         "name_mm": "ညတန",
         "nrc_code": "14",
         "city_mm": "ညောင်တုန်း"
      },
      {
         "id": "348",
         "name_en": "PaTaNa",
         "name_mm": "ပတန",
         "nrc_code": "14",
         "city_mm": "ပန်းတနော်"
      },
      {
         "id": "349",
         "name_en": "PhaPaNa",
         "name_mm": "ဖပန",
         "nrc_code": "14",
         "city_mm": "ဖျာပုံ"
      },
      {
         "id": "350",
         "name_en": "ThaPaNa",
         "name_mm": "သပန",
         "nrc_code": "14",
         "city_mm": "သာပေါင်း"
      },
      {
         "id": "351",
         "name_en": "WaKhaMa",
         "name_mm": "ဝခမ",
         "nrc_code": "14",
         "city_mm": "ဝါးခယ်မ"
      },
      {
         "id": "352",
         "name_en": "PaThaNa",
         "name_mm": "ပသန",
         "nrc_code": "14",
         "city_mm": "ပုသိမ်(အနောက်)"
      },
      {
         "id": "353",
         "name_en": "YaKaNa",
         "name_mm": "ရကန",
         "nrc_code": "14",
         "city_mm": "ရေကြည်"
      },
      {
         "id": "354",
         "name_en": "ZaLaNa",
         "name_mm": "ဇလန",
         "nrc_code": "14",
         "city_mm": "ဇလွန်"
      },
      {
         "id": "355",
         "name_en": "KaKaHta",
         "name_mm": "ကကထ",
         "nrc_code": "14",
         "city_mm": "ကန်ကြီးထောင့်"
      },
      {
         "id": "420",
         "name_en": "AhMaTa",
         "name_mm": "အမတ",
         "nrc_code": "14",
         "city_mm": "အမာ"
      },
      {
         "id": "421",
         "name_en": "NgaYaKa",
         "name_mm": "ငရက",
         "nrc_code": "14",
         "city_mm": "ငရုတ်ကောင်း"
      },
      {
         "id": "422",
         "name_en": "PaSaLa",
         "name_mm": "ပစလ",
         "nrc_code": "14",
         "city_mm": "ပြင်စလူ"
      },
      {
         "id": "423",
         "name_en": "YaThaYa",
         "name_mm": "ရသယ",
         "nrc_code": "14",
         "city_mm": "ရွှေသောင်ယံ"
      }
   ];

const text = {
  en: {
    title: "Registration",
    step1: "Checking State",
    step2: "Account Info",
    step3: "OTP",
    name: "Name",
    fatherName: "Father Name",
    rollNumber: "Roll Number",
    nrc: "NRC",
    township: "Township",
    graduatedYear: "Graduated Year",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    check: "Check Approval",
    checking: "Checking...",
    sendOtp: "Send OTP",
    sending: "Sending...",
    verifyOtp: "Verify OTP",
    verifying: "Verifying...",
    back: "Back",
    already: "Already have an account?",
    login: "Login",
    approvalHelp: "Enter the same data that admin added.",
    accountHelp: "Email must not already be registered. OTP will be sent after validation.",
    otpHelp: "Enter the 6-digit OTP sent to your email.",
    approved: "Approved register data found.",
    required: "Please fill all required fields.",
    invalidEmail: "Invalid email format. Example: example@gmail.com",
    weakPassword:
      "Password needs uppercase, lowercase, number, symbol and 8+ characters.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
  },
  mm: {
    title: "မှတ်ပုံတင်ရန်",
    step1: "ဒေတာစစ်ဆေးရန်",
    step2: "Account အချက်အလက်",
    step3: "OTP",
    name: "အမည်",
    fatherName: "အဖအမည်",
    rollNumber: "Roll Number",
    nrc: "NRC",
    township: "Township",
    graduatedYear: "ဘွဲ့ရနှစ်",
    email: "အီးမေးလ်",
    password: "စကားဝှက်",
    confirmPassword: "စကားဝှက် အတည်ပြု",
    check: "Approval စစ်မည်",
    checking: "စစ်ဆေးနေသည်...",
    sendOtp: "OTP ပို့မည်",
    sending: "ပို့နေသည်...",
    verifyOtp: "OTP အတည်ပြုမည်",
    verifying: "စစ်ဆေးနေသည်...",
    back: "နောက်သို့",
    already: "Account ရှိပြီးသားလား?",
    login: "Login",
    approvalHelp: "Admin ထည့်ထားသည့် data နှင့် တူအောင် ဖြည့်ပါ။",
    accountHelp: "Email စာရင်းသွင်းပြီးသား မဖြစ်ရပါ။ Validation မှန်မှ OTP ပို့ပါမည်။",
    otpHelp: "Email သို့ ပို့ထားသော OTP ၆ လုံး ထည့်ပါ။",
    approved: "Admin မှ အတည်ပြုထားသော data တွေ့ပါသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    invalidEmail: "Email format မမှန်ပါ။ example@gmail.com ပုံစံဖြစ်ရမည်။",
    weakPassword:
      "Password တွင် အကြီးစာလုံး၊ အသေးစာလုံး၊ နံပါတ်၊ symbol နှင့် 8 လုံးအထက် ပါရမည်။",
    passwordMismatch: "Password မတူပါ။",
    passwordMatched: "Password တူညီပါသည်။",
    checkFirst: "အရင်ဆုံး approval စစ်ပါ။",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
  },
};

function enToMmDigit(value: string) {
  return value.replace(/[0-9]/g, (digit) => mmDigits[Number(digit)]);
}

function normalizeNrcRow(item: any): NrcItem {
  const rawName = String(item.name_mm || "").trim();
  const match = rawName.match(/\((.*?)\)\s*(.*)/);

  return {
    id: String(item.id || `${item.nrc_code}-${rawName}`),
    name_en: String(item.name_en || ""),
    name_mm: match ? match[1] : rawName,
    nrc_code: String(item.nrc_code || ""),
    city_mm: String(item.city_mm || (match ? match[2] : "")),
  };
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function passwordRules(password: string) {
  return [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase", valid: /[A-Z]/.test(password) },
    { label: "Lowercase", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function isPasswordStrong(password: string) {
  return passwordRules(password).every((rule) => rule.valid);
}

export default function RegisterPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const router = useRouter();
  const { status } = useSession();

  const [step, setStep] = useState<Step>("approval");

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("2026");

  const [nrcData, setNrcData] = useState<NrcItem[]>([]);
  const [nrcRegion, setNrcRegion] = useState("14");
  const [nrcCode, setNrcCode] = useState("ဟသတ");
  const [nrcType, setNrcType] = useState("(နိုင်)");
  const [nrcNumber, setNrcNumber] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMatchSuccess, setShowMatchSuccess] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    fatherName: false,
    rollNumber: false,
    nrc: false,
    graduatedYear: false,
    email: false,
    password: false,
    confirmPassword: false,
    otp: false,
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Updated to use INLINE_NRC_DATA instead of fetching
  useEffect(() => {
    try {
      const rows: NrcItem[] = INLINE_NRC_DATA.map(normalizeNrcRow);
      const validRows = rows.filter((item) => item.name_mm && item.nrc_code);
      
      setNrcData(validRows);

      const defaultTownship = validRows.find(
        (item) => item.nrc_code === "14" && item.name_mm === "ဟသတ",
      );

      if (defaultTownship) {
        setNrcRegion("14");
        setNrcCode(defaultTownship.name_mm);
      }
    } catch {
      setNrcData([]);
    }
  }, []);

  const filteredTownships = useMemo(() => {
    return nrcData.filter((item) => item.nrc_code === nrcRegion);
  }, [nrcData, nrcRegion]);

  const selectedTownship = filteredTownships.find(
    (item) => item.name_mm === nrcCode,
  );

  const nrcValue = useMemo(() => {
    if (!nrcRegion || !nrcCode || !nrcType || nrcNumber.length !== 6) return "";
    return `${enToMmDigit(nrcRegion)}/${nrcCode}${nrcType}${nrcNumber}`;
  }, [nrcRegion, nrcCode, nrcType, nrcNumber]);

  useEffect(() => {
    const exists = filteredTownships.some((item) => item.name_mm === nrcCode);

    if (!exists && filteredTownships[0]) {
      setNrcCode(filteredTownships[0].name_mm);
    }
  }, [filteredTownships, nrcCode]);

  useEffect(() => {
    setApproved(false);
    setMessage("");
    setError("");
  }, [
    name,
    fatherName,
    rollNumber,
    nrcRegion,
    nrcCode,
    nrcType,
    nrcNumber,
    graduatedYear,
  ]);

  useEffect(() => {
    if (
      touched.confirmPassword &&
      confirmPassword &&
      password &&
      password === confirmPassword
    ) {
      setShowMatchSuccess(true);
      const timer = window.setTimeout(() => setShowMatchSuccess(false), 5000);
      return () => window.clearTimeout(timer);
    }

    setShowMatchSuccess(false);
  }, [password, confirmPassword, touched.confirmPassword]);

  const fieldErrors = {
    name: touched.name && !name.trim() ? t.required : "",
    fatherName: touched.fatherName && !fatherName.trim() ? t.required : "",
    rollNumber: touched.rollNumber && !rollNumber.trim() ? t.required : "",
    nrc: touched.nrc && !nrcValue ? t.required : "",
    graduatedYear:
      touched.graduatedYear &&
      (!graduatedYear.trim() ||
        Number.isNaN(Number(graduatedYear)) ||
        Number(graduatedYear) < 1900 ||
        Number(graduatedYear) > 2100)
        ? t.required
        : "",
    email:
      touched.email && email.trim() && !isEmailValid(email)
        ? t.invalidEmail
        : "",
    password:
      touched.password && password && !isPasswordStrong(password)
        ? t.weakPassword
        : "",
    confirmPassword:
      touched.confirmPassword && confirmPassword && password !== confirmPassword
        ? t.passwordMismatch
        : "",
    otp:
      touched.otp && otp.join("").length > 0 && otp.join("").length !== OTP_LENGTH
        ? t.otpInvalid
        : "",
  };

  const approvalValid =
    Boolean(name.trim()) &&
    Boolean(fatherName.trim()) &&
    Boolean(rollNumber.trim()) &&
    Boolean(nrcValue) &&
    Boolean(graduatedYear.trim()) &&
    !fieldErrors.graduatedYear;

  const accountValid =
    Boolean(email.trim()) &&
    isEmailValid(email) &&
    Boolean(password) &&
    isPasswordStrong(password) &&
    Boolean(confirmPassword) &&
    password === confirmPassword;

  function resetMessages() {
    setMessage("");
    setError("");
  }

  function markApprovalTouched() {
    setTouched((prev) => ({
      ...prev,
      name: true,
      fatherName: true,
      rollNumber: true,
      nrc: true,
      graduatedYear: true,
    }));
  }

  function markAccountTouched() {
    setTouched((prev) => ({
      ...prev,
      email: true,
      password: true,
      confirmPassword: true,
    }));
  }

  async function checkApproval() {
    resetMessages();
    markApprovalTouched();
    setApproved(false);

    if (!approvalValid) {
      setError(t.required);
      return;
    }

    setChecking(true);

    try {
      const res = await fetch("/api/register/check-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          rollNumber: rollNumber.trim(),
          nrc: nrcValue,
          graduatedYear: Number(graduatedYear),
          lang: currentLang,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.approved) {
        setError(data.error || data.message || t.required);
        return;
      }

      setApproved(true);
      setMessage(data.message || t.approved);

      window.setTimeout(() => {
        setStep("info");
        resetMessages();
      }, 600);
    } catch {
      setError("Server error.");
    } finally {
      setChecking(false);
    }
  }

  async function sendOtp() {
    resetMessages();
    markAccountTouched();

    if (!approved) {
      setStep("approval");
      setError(t.checkFirst);
      return;
    }

    if (!accountValid) {
      setError(t.required);
      return;
    }

    setSendingOtp(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: name.trim(),
          fatherName: fatherName.trim(),
          rollNumber: rollNumber.trim(),
          nrc: nrcValue,
          graduatedYear: Number(graduatedYear),
          email: email.trim(),
          password,
          lang: currentLang,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Registration failed.");
        return;
      }

      setEmail(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setMessage(data.message || "");
      setStep("otp");

      window.setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } catch {
      setError("Registration failed.");
    } finally {
      setSendingOtp(false);
    }
  }

  function changeOtp(value: string, index: number) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];

    next[index] = digit;
    setOtp(next);
    setTouched((prev) => ({ ...prev, otp: true }));

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    resetMessages();
    setTouched((prev) => ({ ...prev, otp: true }));

    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError(t.otpInvalid);
      return;
    }

    setVerifyingOtp(true);

    try {
      const res = await fetch("/api/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || "Invalid OTP.");
        return;
      }

      router.replace(data.redirect || "/settings");
    } catch {
      setError("OTP verification failed.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  return (
    <main className="mm page-wrapper relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="relative z-10 w-full max-w-md">
        <div className="ucsh-card ucsh-animate overflow-hidden p-0">
          <div className="h-1.5 bg-gradient-to-r from-[var(--ucsh-primary)] via-[var(--ucsh-secondary)] to-[var(--ucsh-accent)]" />

          <div className="relative p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ucsh-muted)] hover:text-[var(--ucsh-primary-dark)]"
              >
                <ArrowLeft size={16} />
                {t.login}
              </Link>

              <h1 className="text-xl font-black">{t.title}</h1>

              <span className="w-14" />
            </div>

            <Stepper step={step} t={t} />

            {(message || error) && (
              <div
                className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-bold ${
                  error
                    ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                }`}
              >
                {error ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                <span>{error || message}</span>
              </div>
            )}

            {step === "approval" && (
              <div className="mt-6 space-y-4">
                <Help>{t.approvalHelp}</Help>

                <Input
                  label={t.name}
                  value={name}
                  onChange={setName}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  error={fieldErrors.name}
                />

                <Input
                  label={t.fatherName}
                  value={fatherName}
                  onChange={setFatherName}
                  onBlur={() => setTouched((p) => ({ ...p, fatherName: true }))}
                  error={fieldErrors.fatherName}
                />

                <Input
                  label={t.rollNumber}
                  value={rollNumber}
                  onChange={setRollNumber}
                  onBlur={() => setTouched((p) => ({ ...p, rollNumber: true }))}
                  error={fieldErrors.rollNumber}
                />

                <div>
                  <Label>{t.nrc}</Label>

                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={nrcRegion}
                      onChange={(value) => {
                        setNrcRegion(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      {Array.from({ length: 14 }, (_, i) => String(i + 1)).map(
                        (region) => (
                          <option key={region} value={region}>
                            {enToMmDigit(region)}
                          </option>
                        ),
                      )}
                    </Select>

                    <Select
                      value={nrcCode}
                      onChange={(value) => {
                        setNrcCode(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      {filteredTownships.length === 0 ? (
                        <option value="">--</option>
                      ) : (
                        filteredTownships.map((item) => (
                          <option key={item.id} value={item.name_mm}>
                            ({item.name_mm})
                          </option>
                        ))
                      )}
                    </Select>

                    <Select
                      value={nrcType}
                      onChange={(value) => {
                        setNrcType(value);
                        setTouched((p) => ({ ...p, nrc: true }));
                      }}
                    >
                      <option value="(နိုင်)">(နိုင်)</option>
                      <option value="(ဧည့်)">(ဧည့်)</option>
                      <option value="(ပြု)">(ပြု)</option>
                    </Select>

                    <input
                      type="text"
                      maxLength={6}
                      value={nrcNumber}
                      placeholder="၁၂၃၄၅၆"
                      onBlur={() => setTouched((p) => ({ ...p, nrc: true }))}
                      onChange={(event) => {
                        const value = enToMmDigit(event.target.value).replace(
                          /[^၀-၉]/g,
                          "",
                        );
                        setNrcNumber(value.slice(0, 6));
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {selectedTownship?.city_mm && (
                    <p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-black text-cyan-700">
                      {t.township} - {selectedTownship.city_mm}
                    </p>
                  )}

                  <FieldError text={fieldErrors.nrc} />
                </div>

                <Input
                  label={t.graduatedYear}
                  type="number"
                  value={graduatedYear}
                  onChange={setGraduatedYear}
                  onBlur={() =>
                    setTouched((p) => ({ ...p, graduatedYear: true }))
                  }
                  error={fieldErrors.graduatedYear}
                />

                <button
                  type="button"
                  disabled={!approvalValid || checking}
                  onClick={checkApproval}
                  className="ucsh-btn h-13 w-full text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checking && <Loader2 size={18} className="animate-spin" />}
                  {checking ? t.checking : t.check}
                </button>
              </div>
            )}

            {step === "info" && (
              <div className="mt-6 space-y-4">
                <Help>{t.accountHelp}</Help>

                <Input
                  label={t.email}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  error={fieldErrors.email}
                />

                <PasswordInput
                  label={t.password}
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  setShow={setShowPassword}
                  onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                  error={fieldErrors.password}
                />

                {touched.password && password && !isPasswordStrong(password) && (
                  <PasswordStrength password={password} />
                )}

                <PasswordInput
                  label={t.confirmPassword}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                  onBlur={() =>
                    setTouched((p) => ({ ...p, confirmPassword: true }))
                  }
                  error={fieldErrors.confirmPassword}
                />

                {showMatchSuccess && (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    {t.passwordMatched}
                  </p>
                )}

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setStep("approval");
                    }}
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                  >
                    {t.back}
                  </button>

                  <button
                    type="button"
                    disabled={!accountValid || sendingOtp}
                    onClick={sendOtp}
                    className="ucsh-btn px-8 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingOtp && <Loader2 size={18} className="animate-spin" />}
                    {sendingOtp ? t.sending : t.sendOtp}
                  </button>
                </div>
              </div>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="mt-6 space-y-5">
                <Help>{t.otpHelp}</Help>

                <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-black text-slate-700">
                  {email}
                </p>

                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      value={digit}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(event) => changeOtp(event.target.value, index)}
                      onKeyDown={(event) => handleOtpKeyDown(event, index)}
                      className="h-12 w-11 rounded-xl border border-slate-300 text-center text-lg font-black outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  ))}
                </div>

                <FieldError text={fieldErrors.otp} />

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setStep("info");
                    }}
                    className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                  >
                    {t.back}
                  </button>

                  <button
                    type="submit"
                    disabled={otp.join("").length !== OTP_LENGTH || verifyingOtp}
                    className="ucsh-btn px-8 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {verifyingOtp && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    {verifyingOtp ? t.verifying : t.verifyOtp}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-center text-sm font-bold text-[var(--ucsh-muted)]">
              {t.already}{" "}
              <Link
                href="/login"
                className="font-black text-[var(--ucsh-primary-dark)] hover:underline"
              >
                {t.login}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stepper({ step, t }: { step: Step; t: (typeof text)["en"] }) {
  const steps = [
    { id: "approval", number: 1, label: t.step1 },
    { id: "info", number: 2, label: t.step2 },
    { id: "otp", number: 3, label: t.step3 },
  ] as const;

  const currentIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="mx-auto max-w-md">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-10 right-10 top-5 h-0.5 bg-slate-300" />

        {steps.map((item, index) => {
          const active = index <= currentIndex;

          return (
            <div
              key={item.id}
              className="relative z-10 flex w-28 flex-col items-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-black ${
                  active
                    ? "border-slate-700 text-slate-900"
                    : "border-slate-300 text-slate-300"
                }`}
              >
                {item.number}
              </div>

              <p
                className={`mt-2 text-center text-xs font-bold ${
                  active ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
      {children}
    </p>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 block text-sm font-bold text-slate-700">{children}</p>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 text-xs font-bold text-red-600">{text}</p>;
}

function Input({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <input
        type={type}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      />

      <FieldError text={error} />
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
    >
      {children}
    </select>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  setShow,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  setShow: (value: boolean) => void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <FieldError text={error} />
    </label>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const rules = passwordRules(password);

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-3">
      {rules.map((rule) => (
        <p
          key={rule.label}
          className={`text-xs font-bold ${
            rule.valid ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {rule.valid ? "✓" : "•"} {rule.label}
        </p>
      ))}
    </div>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}