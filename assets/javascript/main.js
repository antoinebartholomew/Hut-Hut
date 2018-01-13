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

    // Create category array and category string
    var categoryArray = [];
    var categoryString = "";

    // Add to category array based on checkboxes clicked
    if ($("#cat-btn-bnb").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1f8931735");
    }
    if ($("#cat-btn-boarding").hasClass("active")) {
      categoryArray.push("4f4530a74b9074f6e4fb0100");
    }
    if ($("#cat-btn-hostel").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1ee931735");
    }
    if ($("#cat-btn-motel").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d1fb931735");
    }
    if ($("#cat-btn-resort").hasClass("active")) {
      categoryArray.push("4bf58dd8d48988d12f951735");
    }
    if ($("#cat-btn-vacation").hasClass("active")) {
      categoryArray.push("56aa371be4b08b9a8d5734e1");
    }

    // If length of categoryArray is 0 (i.e. no subcategories were clicked)
    if (categoryArray.length === 0) {
      // Set categoryString to hotel super category
      categoryString = "4bf58dd8d48988d1fa931735"
    } else {
      // Otherwise join array to string using commas
      categoryString = categoryArray.join(",");
    }


    // Construct search object
    var userUrlObj = {
      clientId : "GCAZLY2LL451QYZAJHC10LXCRPDRNDGOVDXLOJAB51HYDBGT",
      clientSecret : "XXS1NU0C10PGX0XGTGQZ44PBIFSARMO0MOSXATTEGBRJX1GC",
      urlBase : "https://api.foursquare.com/v2/venues/explore?",
      // near
      userSearch : $("#hut-input").val().trim(),
      // categoryId
      hotelCategory : categoryString,
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
    // Clear previous results
    $(".results").empty();
    // Save response array to local array
    var hotelArray = data.response.groups[0].items;

    // Loop through each item in the hotel array
    for (i = 0; i < hotelArray.length; i++) {

      // Grab Foursquare hotel object
      var hotel = hotelArray[i].venue;

      // Create imgUrl variable
      var imgURL = "";
      // If no photo exists
      if (hotel.photos.count === 0) {
        // Set imgURL to local no-image-available file
        imgURL = "assets/images/no-image-available.png";
      } else {
        // Otherwise construction the Foursquare image URL
        var imgPrefix = hotel.photos.groups[0].items[0].prefix;
        var imgSize = "200x200";
        var imgSuffix = hotel.photos.groups[0].items[0].suffix;
        imgURL = imgPrefix + imgSize + imgSuffix;
      }

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

      // Check each key in hotelObject
      $.each(hotelObject, function(index, value) {
        // If value is undefined
        if (value === undefined) {
          // Change value to "Not Available"
          hotelObject[index] = "Not Available";
          }
      });

      // Populate card to results div
      $(".results").append(`
        <div class="card" style="width: 200px; display: inline-block">
          <img class="card-img-top" src="${hotelObject.image}">
          <div class="card-body">
            <h5 class="card-title">${hotelObject.name}</h5>
            <p class="card-text">Address: ${hotelObject.address}, ${hotelObject.city}, ${hotelObject.state}, ${hotelObject.zip}</p>
            <p class="card-text">Rating: ${hotelObject.rating}</p>
            <p class="card-text">Website: <a href="${hotelObject.website}" class="hotel-link" target="_blank">${hotelObject.website}</a></p>
            <p class="card-text">Twitter: <a href="https://twitter.com/${hotelObject.twitter}" class="hotel-link" target="_blank">${hotelObject.twitter}</a></p>
          </div>
        </div>
        `);
    }
  }
});
