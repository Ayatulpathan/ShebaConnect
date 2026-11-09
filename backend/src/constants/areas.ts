export interface DhakaAreaDefinition {
  id: string;
  nameEn: string;
  nameBn: string;
  zone: 'Dhaka North' | 'Dhaka South';
  popularLandmarks: string[];
}

export const DHAKA_AREAS: DhakaAreaDefinition[] = [
  {
    id: 'mirpur',
    nameEn: 'Mirpur',
    nameBn: 'মিরপুর',
    zone: 'Dhaka North',
    popularLandmarks: ['Mirpur 10 Circle', 'Mirpur 1', 'Mirpur 2', 'Mirpur 11', 'Pallabi'],
  },
  {
    id: 'dhanmondi',
    nameEn: 'Dhanmondi',
    nameBn: 'ধানমন্ডি',
    zone: 'Dhaka South',
    popularLandmarks: ['Dhanmondi 27', 'Satmasjid Road', 'Dhanmondi 32', 'Rabindra Sarobar'],
  },
  {
    id: 'gulshan',
    nameEn: 'Gulshan',
    nameBn: 'গুলশান',
    zone: 'Dhaka North',
    popularLandmarks: ['Gulshan 1', 'Gulshan 2', 'Gulshan Avenue'],
  },
  {
    id: 'banani',
    nameEn: 'Banani',
    nameBn: 'বনানী',
    zone: 'Dhaka North',
    popularLandmarks: ['Road 11', 'Banani DOHS', 'Chairman Bari'],
  },
  {
    id: 'uttara',
    nameEn: 'Uttara',
    nameBn: 'উত্তরা',
    zone: 'Dhaka North',
    popularLandmarks: ['Sector 3', 'Sector 7', 'Sector 10', 'Rajlakshmi', 'House Building'],
  },
  {
    id: 'mohammadpur',
    nameEn: 'Mohammadpur',
    nameBn: 'মোহাম্মদপুর',
    zone: 'Dhaka North',
    popularLandmarks: ['Town Hall', 'Taj Mahal Road', 'Noorjahan Road', 'Salimullah Road'],
  },
  {
    id: 'badda',
    nameEn: 'Badda',
    nameBn: 'বাড্ডা',
    zone: 'Dhaka North',
    popularLandmarks: ['Middle Badda', 'North Badda', 'Link Road'],
  },
  {
    id: 'motijheel',
    nameEn: 'Motijheel',
    nameBn: 'মতিঝিল',
    zone: 'Dhaka South',
    popularLandmarks: ['Shapla Chattar', 'Dilkusha', 'Arambagh'],
  },
  {
    id: 'old-dhaka',
    nameEn: 'Old Dhaka',
    nameBn: 'পুরান ঢাকা',
    zone: 'Dhaka South',
    popularLandmarks: ['Sadarghat', 'Armanitola', 'Chawkbazar', 'Nazimuddin Road'],
  },
  {
    id: 'bashundhara',
    nameEn: 'Bashundhara R/A',
    nameBn: 'বসুন্ধরা আ/এ',
    zone: 'Dhaka North',
    popularLandmarks: ['Block A', 'Block C', 'Evercare Hospital', 'NSU Gate'],
  },
  {
    id: 'rampura',
    nameEn: 'Rampura',
    nameBn: 'রামপুরা',
    zone: 'Dhaka South',
    popularLandmarks: ['BTV Center', 'Banasree', 'Hajipara'],
  },
  {
    id: 'tejgaon',
    nameEn: 'Tejgaon',
    nameBn: 'তেজগাঁও',
    zone: 'Dhaka North',
    popularLandmarks: ['Firmgate', 'Bijoy Sarani', 'Industrial Area'],
  },
];

export const VALID_DHAKA_AREA_IDS = DHAKA_AREAS.map((a) => a.id);
