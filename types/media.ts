import { DateTime } from 'luxon'

export interface EpisodeData {
  id: number
  seasonNumber: number
  episodeNumber: number
  title: string
  description: string
  createdAt: DateTime
  image: string | null
  videoPath: string
}

export interface MediaData {
  id: number
  title: string
  description: string | null
  categories: string[]
  directors: string[] | null
  casting: string[] | null
  mainImage: string | null
  logo: string | null
  type: 'film' | 'series'
  videoPath: string
  episodes?: EpisodeData[]
}
