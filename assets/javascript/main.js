/*

CATEGORIES

Hotel: 4bf58dd8d48988d1fa931735
B&B: 4bf58dd8d48988d1f8931735
Boarding House: 4f4530a74b9074f6e4fb0100
Hostel: 4bf58dd8d48988d1ee931735
Motel: 4bf58dd8d48988d1fb931735
Resort: 4bf58dd8d48988d12f951735
Vacation Rental: 56aa371be4b08b9a8d5734e1

*/

$(document).ready(function() {

  // User search button click
  $(document).on("click", "#hut-submit", function() {

    // Prevent Default
    event.preventDefault();

    // Construct search object
    var userUrlObj = {
      clientId : "GCAZLY2LL451QYZAJHC10LXCRPDRNDGOVDXLOJAB51HYDBGT",
      clientSecret : "XXS1NU0C10PGX0XGTGQZ44PBIFSARMO0MOSXATTEGBRJX1GC",
      urlBase : "https://api.foursquare.com/v2/venues/explore?",
      // near
      userSearch : $("#hut-input").val().trim(),
      // categoryId
      hotelCategory : "4bf58dd8d48988d1fa931735",
      // limit
      limit : "10"
    }

    // Construct query URL
    var queryUrl = `${userUrlObj.urlBase}&v=20180113&categoryId=${userUrlObj.hotelCategory}&near=${userUrlObj.userSearch}&limit=${userUrlObj.limit}&venuePhotos=1&client_id=${userUrlObj.clientId}&client_secret=${userUrlObj.clientSecret}`;


    // AJAX Request
    $.ajax({
      url : queryUrl,
      method : "GET"
    }).done(createHotelObjects);
  });

  // Populate Cards
  function createHotelObjects(data) {
    // Save response array to local array
    var hotelArray = data.response.groups[0].items;
    console.log("Hotel Array");
    console.log(hotelArray);
    console.log("----------------");

    // Loop through each item in the hotel array
    for (i = 0; i < hotelArray.length; i++) {

      // Grab Foursquare hotel object
      var hotel = hotelArray[i].venue;

      // Build image URL first
      var imgPrefix = hotel.photos.groups[0].items[0].prefix;
      var imgSize = "200x200";
      var imgSuffix = hotel.photos.groups[0].items[0].suffix;
      var imgURL = imgPrefix + imgSize + imgSuffix;

      // Create hotel object with parameters we're interested in
      var hotelObject = {
        id : hotel.id,
        name : hotel.name,
        phone : hotel.contact.phone,
        twitter : hotel.contact.twitter,
        address : hotel.location.address,
        city : hotel.location.city,
        state : hotel.location.state,
        zip : hotel.location.postalCode,
        lat : hotel.location.lat,
        long : hotel.location.lng,
        rating : hotel.rating,
        website : hotel.url,
        image : imgURL
      }

      // Populate card to results div
      $(".results").append(`
        <div class="card" style="width: 200px;">
          <img class="card-img-top" src="${hotelObject.image}">
          <div class="card-body">
            <h5 class="card-title">${hotelObject.name}</h5>
            <p class="card-text">Address: ${hotelObject.address}, ${hotelObject.city}, ${hotelObject.state}, ${hotelObject.zip}</p>
            <p class="card-text">Rating: ${hotelObject.rating}</p>
            <p class="card-text">Website: ${hotelObject.website}</p>
          </div>
        </div>
        `);
    }
  }

});
