export const familyJson = {
  title: "The Smith Family",
  subtitle: "A record of four generations",
  name: "Grampa",
  dates: "b.1920",
  spouse: {
    name: "Gramma",
  },
  children: [
    {
      name: "Child0",
      spouse: {
        name: "Child0 spouse",
      },
      children: [
        {
          name: "GrandChild0",
          spouse: {
            name: "GrandChild0 spouse",
          },
          children: [
            {
              name: "GrandGrandChild00",
              children: [
                { name: "GreatGrandChild000" },
                { name: "GreatGrandChild001" },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "Child1",
      spouse: {
        name: "Child1 spouse",
      },
    },
    {
      name: "Child2",
      children: [
        {
          name: "GrandChild1",
          children: [
            { name: "GrandGrandChild1" },
            {
              name: "GrandGrandChild2",
              children: [
                {
                  name: "GreatGrandChild1",
                  spouse: {
                    name: "GreatGrandChild1 spouse",
                  },
                  children: [
                    { name: "GreatGreatGrandChild1" },
                    { name: "GreatGreatGrandChild2" },
                  ],
                },
                {
                  name: "GreatGrandChild2",
                  children: [
                    { name: "GreatGreatGrandChild3" },
                    { name: "GreatGreatGrandChild4" },
                  ],
                },
              ],
            },
          ],
        },
        { name: "GrandChild1" },
      ],
    },
    {
      name: "Child3",
      spouse: {
        name: "Child3 spouse",
      },
    },
    {
      name: "Child4",
      spouse: {
        name: "Child4 spouse",
      },
      children: [
        {
          name: "GrandChild2",
          spouse: {
            name: "GrandChild2 spouse",
          },
        },
      ],
    },
  ],
};
