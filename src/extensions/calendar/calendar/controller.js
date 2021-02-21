function newFunction() {
  return {
    ctrl: undefined,
    async init(ctrl) {
      this.ctrl = ctrl;
      // eslint-disable-next-line no-void
      void this.backGroundInit();
    },
    async backGroundInit() {},
    async initMustache() {
      if (this.ctrl.dataNode.calendar) {
        const availableColors = [
          'bg-primary',
          'bg-secondary',
          'bg-success',
          'bg-danger',
          'bg-warning',
          'bg-info',
        ];
        const noMoreFreeColor = 'bg-dark';

        this.ctrl.calendarClass =
          1 === this.ctrl.dataNode.calendar.months.length
            ? 'col-12'
            : 2 === this.ctrl.dataNode.calendar.months.length
            ? 'col-12 col-lg-6'
            : 'col-12 col-lg-6 col-xl-4';

        for (const event of this.ctrl.dataNode.calendar.dates) {
          /*
          let popup = event.popupTemplate.text;
          for (const id in event.popupTemplate.uris) {
            popup = popup.replace(
              new RegExp(id, 'g'),
              this.ctrl.getPageHref({
                treeNode: {
                  id: event.popupTemplate.uris[id].pageId,
                  name: event.popupTemplate.uris[id].pageName,
                },
              }),
            );
          }
          event.popup = popup.replace(new RegExp('"', 'g'), '&quot;');*/
          event.popupHref = this.ctrl.getPopupHref(event);
        }
        for (const month of this.ctrl.dataNode.calendar.months) {
          const monthDays = [];
          let day = 0;
          for (; day < month.firstMonthWeekDay; day++) {
            monthDays.push({});
          }
          for (let date = 1; date <= month.monthDays; date++) {
            const newDay = {
              dayOfWeek: day,
              lastWeekDay: day === 6 && date !== month.monthDays,
              events: [],
              date: date,
              dayId: month.id + date,
            };

            for (const event of this.ctrl.dataNode.calendar.dates) {
              event.eventTitle = event.eventTitle.replace(/"/g, '&quot;');
              event.menuTitle = event.menuTitle.replace(/"/g, '&quot;');

              if (event.fromId <= newDay.dayId && event.toId >= newDay.dayId) {
                if (day === 0 || event.fromId === newDay.dayId) {
                  if (event.fromId === newDay.dayId) {
                    let color = availableColors.shift();
                    if (!color) {
                      color = noMoreFreeColor;
                    }
                    event.color = color;
                  }
                  newDay.events.push({
                    event: event,
                    begin: event.fromId === newDay.dayId,
                    href: this.ctrl.getPageHref(event),
                    end:
                      Math.min(event.toId - newDay.dayId, 6 - day) ===
                      event.toId - newDay.dayId,
                    span:
                      1 +
                      Math.min(
                        event.toId - newDay.dayId,
                        6 - day,
                        month.id + month.monthDays - newDay.dayId,
                      ),
                  });
                } else {
                  newDay.events.push({
                    event: event,
                    begin: false,
                    href: this.ctrl.getPageHref(event),
                    end:
                      Math.min(event.toId - newDay.dayId, 6 - day) ===
                      event.toId - newDay.dayId,
                    span: 1,
                    transparent: true,
                  });
                }
              }
            }
            for (const event of this.ctrl.dataNode.calendar.dates) {
              if (
                event.toId === newDay.dayId &&
                noMoreFreeColor !== event.color
              ) {
                availableColors.push(event.color);
              }
            }
            monthDays.push(newDay);
            day = (day + 1) % 7;
          }

          for (; day % 7 > 0; day++) {
            monthDays.push({});
          }
          month.days = monthDays;
        }
      }
    },
  };
}
newFunction();
