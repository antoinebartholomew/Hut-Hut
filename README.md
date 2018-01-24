# Hut-Hut
Team Bear Project 1: Hotel Planning Application (Hut Hut)

## Tagline
Hut Hut: Simply Luxurious

## Link
https://awyand.github.io/Hut-Hut/

## Description
Hut Hut is a hotel wish list application utilizing the Foursquare API for people that aren't ready to book a trip yet, but want to plan for the future.  The user is presented with a simple search bar for their destination and hotel options (hotel, motel, hostel, resort, etc) and is then presented with a collection of results to choose from.  The results include an image, hotel rating, a Google Maps overview (from API), and basic contact information.  The user is able to drag and drop results to either a favorites list or a trash list, which are saved in Firebase for future review.

## Architecture

Login Screen
![alt text](https://github.com/awyand/Hut-Hut/blob/master/assets/images/Login.PNG)

Search Bar
![alt text](https://github.com/awyand/Hut-Hut/blob/master/assets/images/Searchbar.PNG)

Search Results
![alt text](https://github.com/awyand/Hut-Hut/blob/master/assets/images/Results.PNG)

Google Map Display
![alt text](https://github.com/awyand/Hut-Hut/blob/master/assets/images/map.PNG)

Design Layout
![alt text](https://github.com/awyand/Hut-Hut/blob/master/assets/images/Hut_Hut_Presentation.jpg)

## APIs to be Used
 - Foursquare Places
 - Google Maps

## Team Members
  - Aaron Wyand
    <img src="https://github.com/awyand/Hut-Hut/blob/master/assets/images/aaron.png" height="200px">
  - Nathan Alston
    <img src="https://github.com/awyand/Hut-Hut/blob/master/assets/images/nathan.png" height="200px">
  - Tiara Welch
    <img src="https://github.com/awyand/Hut-Hut/blob/master/assets/images/tiara.png" height="200px">
  - Andrew Mugendi
    <img src="https://github.com/awyand/Hut-Hut/blob/master/assets/images/andrew.png" height="200px">

## Rough Breakdown of Tasks
 - MVP: take user input (city) and return a list of 10 hotels in that city
    - Use user input to form API request
    - Display data from API response on page
 - Features:
    - Stylish page layout
    - Creation of favorites and trash lists
    - Store favorites and trash lists in Firebase
    - Images as part of the result (from Foursquare API response)
    - Google Maps overview as part of result (Foursquare API response feeds into Google Maps API request)
    - Drag and drop to favorites / trash lists (jQuery UI)
    - Pagination/offset of results (modifying Foursquare API request)
    - Open authentication for personalized favorites / trash lists (database organization)
