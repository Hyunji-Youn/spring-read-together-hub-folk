import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';

const events = [
  {
    id: 1,
    title: "Monthly Book Discussion",
    date: "May 15, 2025",
    time: "19:00 - 21:00",
    location: "Spring Cafe, Seoul",
    description: "Join us as we discuss 'The Midnight Library' by Matt Haig"
  },
  {
    id: 2,
    title: "Author Workshop",
    date: "May 22, 2025",
    time: "18:30 - 20:30",
    location: "Literary Lounge, Gangnam",
    description: "Special workshop on creative writing techniques"
  }
];

const UpcomingEvents = () => {
  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif italic text-bookish-maroon">Upcoming Events</h2>
        <Button variant="link" className="text-bookish-maroon hover:text-bookish-dark font-serif">
          View Calendar
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="border border-bookish-maroon/20 bg-bookish-light hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-bookish-maroon">{event.title}</CardTitle>
              <div className="text-sm text-muted-foreground space-y-1 pt-2">
                <div className="flex items-center text-bookish-dark/80">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-bookish-dark/80">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center text-bookish-dark/80">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-bookish-dark/80">{event.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-bookish-maroon border-bookish-maroon/30 hover:bg-bookish-maroon/10">
                RSVP
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default UpcomingEvents;
