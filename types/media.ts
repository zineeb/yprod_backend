// types/media.ts

import { DateTime } from 'luxon';

export interface EpisodeData {
  id: number;
  season_number: number;
  episode_number: number;
  title: string;
  description: string;
  created_at: DateTime;
  image: string | null;
}

export interface MediaData {
  id: number;
  title: string;
  description: string | null;
  categories: string[];
  directors: string[] | null;
  casting: string[] | null;
  main_image: string | null;
  logo: string | null;
  type: 'film' | 'series';
  episodes?: EpisodeData[]; // Optional property
}
